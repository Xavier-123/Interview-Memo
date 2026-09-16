export const PRIVACY_RULES: [RegExp, string][] = [
  [/Interview\s*Memo/gi, 'Dev Memo'],
  [/求职面试\s*OS/gi, '工作管理 OS'],
  [/求职面试/g, 'QZ/MS'],
  [/模拟面试/g, 'MNMS'],
  [/技术面/g, 'JSM'],
  [/HR面/gi, 'HRM'],
  [/终面/g, 'ZM'],
  [/一面/g, '1M'],
  [/二面/g, '2M'],
  [/三面/g, '3M'],
  [/加面/g, 'JM'],
  [/笔试/g, 'BS'],
  [/面试/g, 'MS'],
  [/简历/g, 'JL'],
  [/求职/g, 'QZ'],
  [/岗位/g, 'GW'],
  [/投递/g, 'TD'],
  [/薪资/g, 'XZ'],
  [/月薪/g, 'YX'],
  [/年薪/g, 'NX'],
  [/题库/g, 'TK'],
  [/复盘/g, 'FP'],
  [/候选人/g, 'HXR'],
  [/录用/g, 'LY'],
  [/\bOffer\b/g, 'OF'],
  [/\boffer\b/g, 'of'],
]

export function maskPrivacyText(text: string): string {
  if (!text) return text
  let res = text
  for (const [regex, replacement] of PRIVACY_RULES) {
    res = res.replace(regex, replacement)
  }
  return res
}

class PrivacyManager {
  private enabled = false
  private observer: MutationObserver | null = null
  private titleObserver: MutationObserver | null = null
  private originalTextMap = new WeakMap<Text, string>()
  private originalPlaceholderMap = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>()
  private originalTitle: string | null = null

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return
    this.enabled = enabled
    if (enabled) {
      this.activate()
    } else {
      this.deactivate()
    }
  }

  private isIgnoredElement(el: Node | null): boolean {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false
    const tagName = (el as Element).tagName
    return (
      tagName === 'SCRIPT' ||
      tagName === 'STYLE' ||
      tagName === 'NOSCRIPT' ||
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA'
    )
  }

  private processTextNode(node: Text) {
    if (this.isIgnoredElement(node.parentNode)) return
    const current = node.nodeValue ?? ''
    if (!current.trim()) return

    if (!this.originalTextMap.has(node)) {
      this.originalTextMap.set(node, current)
    }

    const original = this.originalTextMap.get(node) ?? current
    const masked = maskPrivacyText(original)
    if (node.nodeValue !== masked) {
      node.nodeValue = masked
    }
  }

  private processPlaceholder(el: HTMLInputElement | HTMLTextAreaElement) {
    const current = el.getAttribute('placeholder')
    if (!current) return

    if (!this.originalPlaceholderMap.has(el)) {
      this.originalPlaceholderMap.set(el, current)
    }

    const original = this.originalPlaceholderMap.get(el) ?? current
    const masked = maskPrivacyText(original)
    if (el.getAttribute('placeholder') !== masked) {
      el.setAttribute('placeholder', masked)
    }
  }

  private walkAndMask(root: Node) {
    if (root.nodeType === Node.TEXT_NODE) {
      this.processTextNode(root as Text)
      return
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      const el = root as Element
      if (this.isIgnoredElement(el)) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          this.processPlaceholder(el as HTMLInputElement | HTMLTextAreaElement)
        }
        return
      }

      const inputs = el.querySelectorAll('input[placeholder], textarea[placeholder]')
      inputs.forEach((input) =>
        this.processPlaceholder(input as HTMLInputElement | HTMLTextAreaElement),
      )

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (this.isIgnoredElement(node.parentNode)) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      })

      let textNode: Text | null = walker.nextNode() as Text | null
      while (textNode) {
        this.processTextNode(textNode)
        textNode = walker.nextNode() as Text | null
      }
    }
  }

  private updateTitle() {
    if (typeof document === 'undefined') return
    if (!this.originalTitle) {
      this.originalTitle = document.title
    }
    const masked = maskPrivacyText(document.title)
    if (document.title !== masked) {
      document.title = masked
    }
  }

  private activate() {
    if (typeof document === 'undefined') return

    document.documentElement.classList.add('privacy-mode-active')
    this.updateTitle()
    this.walkAndMask(document.body)

    this.observer = new MutationObserver((mutations) => {
      if (!this.enabled) return

      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const node = mutation.target as Text
          if (this.isIgnoredElement(node.parentNode)) continue

          const current = node.nodeValue ?? ''
          const currentOriginal = this.originalTextMap.get(node)
          if (!currentOriginal || maskPrivacyText(currentOriginal) !== current) {
            this.originalTextMap.set(node, current)
            const masked = maskPrivacyText(current)
            if (node.nodeValue !== masked) {
              node.nodeValue = masked
            }
          }
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => this.walkAndMask(node))
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'placeholder') {
          const target = mutation.target as HTMLInputElement | HTMLTextAreaElement
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            const current = target.getAttribute('placeholder') ?? ''
            const orig = this.originalPlaceholderMap.get(target)
            if (!orig || maskPrivacyText(orig) !== current) {
              this.originalPlaceholderMap.set(target, current)
              const masked = maskPrivacyText(current)
              if (target.getAttribute('placeholder') !== masked) {
                target.setAttribute('placeholder', masked)
              }
            }
          }
        }
      }
    })

    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder'],
    })

    const titleEl = document.querySelector('title')
    if (titleEl) {
      this.titleObserver = new MutationObserver(() => {
        if (this.enabled) {
          this.updateTitle()
        }
      })
      this.titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true })
    }
  }

  private deactivate() {
    if (typeof document === 'undefined') return

    document.documentElement.classList.remove('privacy-mode-active')
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.titleObserver) {
      this.titleObserver.disconnect()
      this.titleObserver = null
    }

    if (this.originalTitle) {
      document.title = this.originalTitle
      this.originalTitle = null
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let textNode: Text | null = walker.nextNode() as Text | null
    while (textNode) {
      if (this.originalTextMap.has(textNode)) {
        const orig = this.originalTextMap.get(textNode)
        if (orig !== undefined && textNode.nodeValue !== orig) {
          textNode.nodeValue = orig
        }
      }
      textNode = walker.nextNode() as Text | null
    }

    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]')
    inputs.forEach((el) => {
      const target = el as HTMLInputElement | HTMLTextAreaElement
      if (this.originalPlaceholderMap.has(target)) {
        const orig = this.originalPlaceholderMap.get(target)
        if (orig !== undefined) {
          target.setAttribute('placeholder', orig)
        }
      }
    })
  }
}

export const privacyManager = new PrivacyManager();
