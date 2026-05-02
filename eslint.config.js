import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*']
  },
  {
    files: ['*.rules', 'DRAFT_firestore.rules'],
    ...firebaseRulesPlugin.configs['flat/recommended']
  }
];


