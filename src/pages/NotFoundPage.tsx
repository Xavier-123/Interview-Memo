import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">页面不存在</p>
      <Link to="/" className="mt-4 text-sm text-primary hover:underline">
        返回首页
      </Link>
    </div>
  )
}
