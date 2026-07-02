import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/navigation'
import {
  PUBLIC_FOOTER_COMPANY,
  PUBLIC_FOOTER_EXPLORE,
  PUBLIC_TAGLINE,
} from '@/config/public-navigation'
import { PUBLIC_LOCALE_NOTICE } from '@/config/public-marketing'
import { cn } from '@/lib/utils'

const footerLinkClass =
  'cursor-pointer text-sm text-gray-600 no-underline transition-colors hover:text-[#0369a1]'

/** Site-wide public footer — premium minimal chrome for all marketing routes. */
export function PublicFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={cn('border-t border-gray-200 bg-white', className)}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-block cursor-pointer text-xl font-bold text-[#0369a1] no-underline transition-colors hover:text-[#0284c7]"
            >
              {APP_NAME}
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-600">{PUBLIC_TAGLINE}</p>
            <p
              className="inline-flex max-w-sm items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-500"
              role="note"
            >
              {PUBLIC_LOCALE_NOTICE}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Explore
            </h2>
            <ul className="mt-4 space-y-2">
              {PUBLIC_FOOTER_EXPLORE.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Company
            </h2>
            <ul className="mt-4 space-y-2">
              {PUBLIC_FOOTER_COMPANY.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-sm text-gray-500 md:text-start">
          © {year} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
