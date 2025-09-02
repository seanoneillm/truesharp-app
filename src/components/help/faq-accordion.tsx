'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const faqItems = [
  {
    question: 'How do I connect my sportsbook?',
    answer: 'Go to Analytics → Link Sportsbooks and log in through SharpSports.',
  },
  {
    question: 'How do I refresh bets?',
    answer: 'In the Analytics page, click Refresh Bets to update your wager history.',
  },
  {
    question: 'Can I enter bets manually?',
    answer: 'No, but you can use the Mock Sportsbook in the Games page to simulate bets.',
  },
  {
    question: 'Where can I update settings?',
    answer: 'Go to the Settings page to manage your account, billing, and notifications.',
  },
  {
    question: 'Are my sportsbook logins safe?',
    answer:
      'Yes. TrueSharp never stores your sportsbook credentials. All syncing is handled securely through SharpSports.',
  },
  {
    question: 'How often do my bets update?',
    answer:
      'Bets update automatically, but you can always click Refresh Bets in Analytics to fetch the latest.',
  },
]

export function FAQAccordion() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="space-y-3">
      {faqItems.map((item, index) => (
        <Collapsible key={index} open={openItems.has(index)} onOpenChange={() => toggleItem(index)}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left font-medium text-gray-900 transition-colors hover:bg-gray-100">
            {item.question}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openItems.has(index) ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 text-gray-600">{item.answer}</CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
