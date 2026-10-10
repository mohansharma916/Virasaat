export interface FaqItem {
  question: string;
  answer: string;
}

export const faqsData: FaqItem[] = [
  {
    question: 'What can I organize in Virasat today?',
    answer: 'The app lets you record financial and document details, upload supported files, save personal messages, organize trusted people and record check-ins. Automated family handover, recipient invitations and milestone delivery are not currently available.',
  },
  {
    question: 'Does Virasat replace a legal will or emergency plan?',
    answer: 'No. It is an organization tool. It does not transfer ownership of financial assets, decide inheritance or provide an emergency response service. Keep independent copies of important documents and a separate estate and emergency plan.',
  },
  {
    question: 'What happens if I miss a check-in?',
    answer: 'A missed check-in does not authorize release of your vault. Scheduled reminder delivery, SMS, push notifications and vacation pause are not currently available. The app does not run an automatic 14-day handover countdown.',
  },
  {
    question: 'Can my trusted people access the vault?',
    answer: 'No recipient access is currently available. Saving a person or an intended assignment does not send an invitation, verify their identity or grant them access. Verified family handover is planned.',
  },
  {
    question: 'How is vault content encrypted?',
    answer: 'Descriptions and uploaded files are encrypted on the server using AES-256-GCM before storage. Virasat manages the server encryption key and authorized server processes can decrypt content. Titles and categories are stored as metadata. The current app does not provide end-to-end encryption or user-held recovery keys.',
  },
  {
    question: 'Can I schedule a message for a birthday or wedding?',
    answer: 'You can save supported personal messages and video files. Automatic delivery on milestones or emergencies is not currently available. The website previews use example content and do not deliver messages.',
  },
  {
    question: 'What happens if I get a new phone?',
    answer: 'Vault content is associated with your account rather than a phone-held encryption key. Sign in using the supported account verification flow on your new phone. Keep independent copies; we do not guarantee permanent storage or recovery in every circumstance.',
  },
  {
    question: 'Does joining the waitlist give me a paid plan?',
    answer: 'No. Joining the waitlist is free and registers you for launch updates. It does not activate a subscription or a lifetime entitlement. Current app plans include Starter, Secure and Family; check the app for prices, limits and purchase availability.',
  },
];
