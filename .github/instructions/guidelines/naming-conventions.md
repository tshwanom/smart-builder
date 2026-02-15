#  Naming Conventions

**Read Time:** 90 seconds

---

## Quick Reference Table

| Type | Convention |  Example |  Wrong |
|------|-----------|-----------|----------|
| **Files** |
| Component | PascalCase.tsx | `UserProfile.tsx` | `user-profile.tsx` |
| Hook | useCamelCase.ts | `useAuth.ts` | `UseAuth.ts` |
| Utility | camelCase.ts | `validators.ts` | `Validators.ts` |
| Type | name.types.ts | `user.types.ts` | `UserTypes.ts` |
| API | kebab-case/ | `user-profile/` | `userProfile/` |
| **Code** |
| Variable | camelCase | `userName` | `user_name` |
| Constant | UPPER_SNAKE | `API_URL` | `apiUrl` |
| Function | camelCase | `getUserData()` | `GetUserData()` |
| Component | PascalCase | `UserCard` | `userCard` |
| Hook | useCamelCase | `useUserData` | `userDataHook` |
| Type/Interface | PascalCase | `UserData` | `userDataType` |
| **Database** |
| Table | snake_case | `user_profiles` | `UserProfiles` |
| Column | snake_case | `created_at` | `createdAt` |

---

## File Naming Examples

```
 GOOD
src/components/UserProfile.tsx
src/hooks/useAuth.ts
src/utils/validators.ts
src/types/user.types.ts
src/pages/api/user-profile/index.ts

 BAD
src/components/user-profile.tsx
src/hooks/UseAuth.ts
src/utils/Validators.ts
src/types/UserTypes.ts
src/pages/api/userProfile/index.ts
```

---

## Variable Naming Examples

```typescript
//  GOOD
const userData = fetchUser();
const MAX_RETRIES = 3;
function calculateTotal() {}
interface UserProfile {}
const useUserData = () => {};

//  BAD
const UserData = fetchUser();
const maxRetries = 3;
function CalculateTotal() {}
interface userProfile {}
const UserDataHook = () => {};
```

---

*Consistent naming = faster code reviews*
