# Home Section i18n Translation Keys Reference

## Overview
This document provides a quick reference for all internationalization (i18n) translation keys used in the `/home` section of the Calico tutoring platform.

---

## Translation Keys by Page

### 🏠 Home Page (`home/page.jsx`)

| Key | English | Spanish | Usage |
|-----|---------|---------|-------|
| `home.loading` | Loading... | Cargando... | Loading spinner message |
| `home.accessRestricted` | Restricted Access | Acceso Restringido | Access denied title |
| `home.loginRequired` | You must log in to access this page. | Debes iniciar sesión para acceder a esta página. | Login requirement message |

---

### 🔍 Explore Page (`home/explore/page.jsx`)

| Key | English | Spanish | Usage |
|-----|---------|---------|-------|
| `explore.bannerTitle` | Need help with your classes? | ¿Necesitas ayuda en tus clases? | Banner title |
| `explore.subjectsTitle` | Your subjects this semester | Tus materias este semestre | Subjects section title |

---

### ⭐ Favorites Page (`home/favorites/page.jsx`)

| Key | English | Spanish | Usage |
|-----|---------|---------|-------|
| `favorites.loading` | Loading… | Cargando… | Loading state |
| `favorites.searchPlaceholder` | Search subjects or tutors | Busca materias o tutores | Search input placeholder |
| `favorites.coursesTitle` | Favorite Courses | Cursos favoritos | Courses section title |
| `favorites.tutorsTitle` | Favorite Tutors | Tutores favoritos | Tutors section title |
| `favorites.emptyCourses` | You don't have any favorite courses yet. | Aún no tienes cursos favoritos. | Empty courses message |
| `favorites.emptyTutors` | You don't have any favorite tutors yet. | Aún no tienes tutores favoritos. | Empty tutors message |
| `favorites.program` | Program: | Programa: | Program label |
| `favorites.findTutor` | Find a tutor | Buscar un tutor | Find tutor button |
| `favorites.reserve` | Book | Reservar | Reserve button |
| `favorites.user` | User | Usuario | User badge |
| `favorites.tutor` | Tutor | Tutor | Tutor badge |

---

### 👤 Profile Page (`home/profile/page.jsx`)

| Key | English | Spanish | Usage |
|-----|---------|---------|-------|
| `profile.title` | User Profile | Perfil del Usuario | Page title |
| `profile.name` | Name: | Nombre: | Name label |
| `profile.phone` | Phone: | Teléfono: | Phone label |
| `profile.email` | Email: | Correo: | Email label |
| `profile.major` | Major: | Carrera: | Major label |
| `profile.notDefined` | Not defined | No definido | Fallback for empty fields |
| `profile.editProfile` | Edit Profile | Editar Perfil | Edit button |
| `profile.logout` | Log Out | Cerrar Sesión | Logout button |
| `profile.becomeTutorTitle` | Want to be a tutor? | ¿Quieres ser tutor? | Modal title |
| `profile.becomeTutorText` | You don't have a tutor profile enabled yet. Complete the form to request access. | Aún no tienes habilitado el perfil de tutor. Completa el formulario para solicitar acceso. | Modal description |
| `profile.goToForm` | Go to form | Ir al formulario | Form link button |
| `profile.close` | Close | Cerrar | Close button |
| `profile.loadingProfile` | Loading profile... | Cargando perfil... | Loading state |

---

## Usage Examples

### Basic Translation
```jsx
import { useI18n } from '../../../lib/i18n';

function MyComponent() {
  const { t } = useI18n();
  
  return <h1>{t('home.loading')}</h1>;
}
```

### Translation with Variables
```jsx
// In translation files:
// "welcome": "Welcome, {name}!"

const { t } = useI18n();
return <p>{t('welcome', { name: user.name })}</p>;
```

### Currency Formatting
```jsx
const { formatCurrency } = useI18n();
return <span>{formatCurrency(25000)}</span>; // "$25,000 COP" or "$25,000"
```

### Date Formatting
```jsx
const { locale, formatDate } = useI18n();
const localeStr = locale === 'en' ? 'en-US' : 'es-ES';

return (
  <p>
    {new Date().toLocaleDateString(localeStr, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
  </p>
);
```

---

## Adding New Translations

### Step 1: Add to en.json
```json
{
  "mySection": {
    "myKey": "My English text"
  }
}
```

### Step 2: Add to es.json
```json
{
  "mySection": {
    "myKey": "Mi texto en español"
  }
}
```

### Step 3: Use in Component
```jsx
const { t } = useI18n();
return <p>{t('mySection.myKey')}</p>;
```

---

## Tips & Best Practices

1. **Hierarchical Structure**: Use dot notation for nested keys (`section.subsection.key`)
2. **Descriptive Names**: Make keys self-documenting (`profile.editProfile` not `profile.btn1`)
3. **Consistent Casing**: Use camelCase for keys (`loginRequired` not `login_required`)
4. **Variable Naming**: Use clear variable names in interpolation (`{name}` not `{x}`)
5. **Development Warnings**: Check console for missing translation warnings
6. **Locale Testing**: Always test both English and Spanish after changes
7. **Context Matters**: Include context in key names when the same word has different meanings

---

## Common Patterns

### Loading States
```jsx
{loading ? <p>{t('common.loading')}</p> : <Content />}
```

### Empty States
```jsx
{items.length === 0 ? <p>{t('section.empty')}</p> : <List />}
```

### Error Messages
```jsx
{error && <div className="error">{t('section.errors.loadFailed')}</div>}
```

### Conditional Text
```jsx
<span>{isEnabled ? t('common.enabled') : t('common.disabled')}</span>
```

---

## Locale Switching

Users can switch languages using the `LocaleSwitcher` component, which is typically in the header. The selected locale is automatically:
- Saved to `localStorage` 
- Saved to cookies for SSR
- Applied to all `t()` calls
- Applied to date/time formatting
- Applied to currency formatting

---

## Related Documentation

- Main i18n implementation: `I18N_IMPLEMENTATION_SUMMARY.md`
- i18n context & provider: `src/lib/i18n/index.jsx`
- English translations: `src/lib/i18n/locales/en.json`
- Spanish translations: `src/lib/i18n/locales/es.json`
