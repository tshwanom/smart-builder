#  Testing Requirements

**Read Time:** 90 seconds

---

## Coverage Target: 80%+

---

## What to Test

### 1. Unit Tests (Utilities & Logic)
```typescript
// Test pure functions
describe('calculatePrice', () => {
  it('calculates correct price', () => {
    expect(calculatePrice(100, 0.1)).toBe(110);
  });
  it('handles zero', () => {
    expect(calculatePrice(0, 0.1)).toBe(0);
  });
});
```

### 2. Component Tests (UI)
```typescript
// Test user interactions
describe('UserForm', () => {
  it('submits valid data', async () => {
    render(<UserForm />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
  });
});
```

### 3. API Tests (Endpoints)
```typescript
// Test HTTP responses
describe('GET /api/users', () => {
  it('returns user list', async () => {
    const res = await fetch('/api/users');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## Quick Checklist

Before marking "complete":
- [ ] Unit tests for utilities
- [ ] Component tests for UI
- [ ] API tests for endpoints
- [ ] Edge cases tested (empty, null, max values)
- [ ] Error states tested
- [ ] Coverage > 80%
- [ ] All tests pass: `npm test`

---

*Tests prevent regressions*
