module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Pendiente: las páginas usan `any` en las respuestas de Supabase. Se desactiva
    // hasta tiparlas con el tipo Database; volver a activarla cuando se haga.
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      // Los contextos exportan su hook (useAuth, useTheme) junto al proveedor y
      // las primitivas de shadcn/ui exportan sus variantes: es intencionado.
      files: ['src/context/**/*.tsx', 'src/components/ui/**/*.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
};
