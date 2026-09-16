import { describe, expect, it } from 'vitest'
import { maskPrivacyText, PRIVACY_RULES } from '@/lib/privacy'

describe('maskPrivacyText', () => {
  it('masks core job-hunting terms to pinyin abbreviations', () => {
    expect(maskPrivacyText('我的面试记录')).toBe('我的MS记录')
    expect(maskPrivacyText('投递岗位与简历')).toBe('TDGW与JL')
    expect(maskPrivacyText('求职管理')).toBe('QZ管理')
    expect(maskPrivacyText('笔试安排')).toBe('BS安排')
    expect(maskPrivacyText('薪资待遇')).toBe('XZ待遇')
  })

  it('masks interview rounds and technical types', () => {
    expect(maskPrivacyText('一面通过，进入二面和三面，最后HR面')).toBe('1M通过，进入2M和3M，最后HRM')
    expect(maskPrivacyText('技术面与模拟面试')).toBe('JSM与MNMS')
    expect(maskPrivacyText('收到Offer')).toBe('收到OF')
  })

  it('masks brand names and slogans', () => {
    expect(maskPrivacyText('Interview Memo')).toBe('Dev Memo')
    expect(maskPrivacyText('求职面试 OS')).toBe('工作管理 OS')
  })

  it('handles empty or non-sensitive text', () => {
    expect(maskPrivacyText('')).toBe('')
    expect(maskPrivacyText('React and TypeScript')).toBe('React and TypeScript')
  })
})
