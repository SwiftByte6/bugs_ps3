# Accessible Form Design and Validation

Accessible web forms ensure users of all abilities can complete job applications, questionnaires, and account registrations smoothly.

## Form Field Standards
1. **Explicit Labels**: Every form field (`<input>`, `<textarea>`, `<select>`) must be associated with an explicit `<label for="...">` matching the field's `id`. Placeholders must never replace visible labels.
2. **Clear Grouping**: Related fields (e.g., address groups, radio groups, date pickers) must be wrapped inside a `<fieldset>` with an informative `<legend>`.
3. **Required Field Indicators**: Required fields must be marked with both a visible indicator (such as an asterisk with explanatory legend) and the programmatic attribute `required` or `aria-required="true"`.
4. **Accessible Error Messages**: Error messages should clearly identify which field has an issue, explain how to resolve it, and link directly to the field using `aria-describedby` and `aria-invalid="true"`.
5. **Autofill Attributes**: Standard fields (name, email, tel, address) should include standard autocomplete tokens to speed up input for users with cognitive or motor impairments.
