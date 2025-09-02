import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Footer() {
  const footerNavigation = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Analytics', href: '/analytics' },
      { name: 'Marketplace', href: '/marketplace' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Status', href: '/status' },
      { name: 'Support', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy', href: '/legal/privacy' },
      { name: 'Terms', href: '/legal/terms' },
      { name: 'Cookies', href: '/legal/cookies' },
      { name: 'Disclaimer', href: '/legal/disclaimer' },
    ],
  }

  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">TrueSharp</span>
            </div>
            <p className="text-sm leading-6 text-gray-300">
              The only verified sports betting platform. Track your real betting performance with
              automatic sportsbook sync and turn your expertise into income.
            </p>
            <div className="flex space-x-6">{/* Social links would go here */}</div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.product.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.company.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.support.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.legal.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-gray-300 transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-800 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2025 TrueSharp. All rights reserved.
            </p>
            <div className="mt-4 flex space-x-6 md:mt-0">
              <p className="text-xs leading-5 text-gray-400">
                Must be 18+ to use TrueSharp. Please gamble responsibly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
