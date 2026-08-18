export const en = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    userFallback: 'Me',
  },
  tabBar: {
    contacts: 'Contacts',
    groups: 'Groups',
    me: 'Me',
    navAriaLabel: 'Main navigation',
  },
  actionSheet: {
    menuAriaLabel: 'Actions',
  },
  scrollToBottom: {
    ariaLabel: 'Scroll to bottom',
  },
  syncPendingReply: {
    message: 'Syncing unfinished reply...',
  },
  me: {
    title: 'Me',
    settings: 'Settings',
    logout: 'Log out',
    loggingOut: 'Logging out...',
  },
  contacts: {
    title: 'Contacts',
    addAriaLabel: 'Add AI',
    loadError: 'Could not load contacts',
    sectionMyAi: 'My AI',
    empty: 'No AI friends yet. Tap + to add one.',
  },
  addContact: {
    title: 'Add AI',
    loadError: 'Could not load characters',
    empty: 'No characters available to add',
    add: 'Add',
    addedToast: 'Added {name}',
  },
  chat: {
    moreActions: 'More actions',
    clearHistory: 'Clear chat history',
    clearHistoryDescription:
      'This will delete all messages in this chat and cannot be undone. Continue?',
    clearConfirm: 'Clear',
    deleteAi: 'Delete AI',
    deleteConfirm: 'Delete',
    deleteAiDescription:
      'Remove {name} from contacts? Chat history will also be deleted and cannot be recovered.',
    thisAi: 'this AI',
    loadError: 'Could not load this chat. Add this AI as a friend first.',
    backToContacts: 'Back to contacts',
    generatingAria: 'Generating reply',
  },
  chatDate: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
  chatInput: {
    placeholder: 'Message...',
    placeholderStreaming: 'Generating...',
    send: 'Send',
    mentionAria: 'Currently @ {name}. Tap to change.',
  },
  groups: {
    title: 'Groups',
    create: 'New group',
    loadError: 'Could not load groups',
    empty: 'No groups yet',
    noMembers: 'No members',
    memberCount: '{count} members',
    memberNameSeparator: ', ',
  },
  createGroup: {
    title: 'New group',
    nameLabel: 'Group name',
    namePlaceholder: 'Enter a group name',
    selectMembers: 'Select members',
    creating: 'Creating...',
    createAndEnter: 'Create and open',
  },
  groupMembers: {
    title: 'Manage members',
    loadError: 'Could not load members',
    backToChat: 'Back to chat',
    selectMembers: 'Select members',
    saving: 'Saving...',
    save: 'Save',
    pickerEmpty: 'Could not load contacts. Go back and try again.',
    defaultMember: 'Default',
  },
  groupChat: {
    manageMembers: 'Manage members',
    deleteGroup: 'Delete group',
    deleteDescription:
      'Delete {name}? Group messages will also be deleted and cannot be recovered.',
    thisGroup: 'this group',
    selectMember: 'Select member',
    currentMember: '{name} (current)',
    loadError: 'Could not load this group',
    backToList: 'Back to groups',
    turnCueCap: 'Follow-up turn limit reached',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
  },
  auth: {
    username: 'Username',
    password: 'Password',
    languageAria: 'Language',
  },
  login: {
    title: 'Log in to pai-arbor',
    noAccount: "Don't have an account?",
    goRegister: 'Sign up',
    submit: 'Log in',
    submitting: 'Logging in...',
  },
  register: {
    title: 'Create an account',
    displayName: 'Display name',
    confirmPassword: 'Confirm password',
    hasAccount: 'Already have an account?',
    goLogin: 'Log in',
    submit: 'Sign up and log in',
    submitting: 'Creating account...',
  },
} as const;

export type Messages = {
  [K in keyof typeof en]: { [P in keyof (typeof en)[K]]: string };
};
