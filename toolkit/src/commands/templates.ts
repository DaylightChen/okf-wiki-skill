export function bodyTemplate(type: string): string {
  const t = type.toLowerCase();
  if (t === 'reference') {
    return '# Definition\n\nDescribe the concept here.\n\n# Citations\n';
  }
  if (t.includes('table')) {
    return '# Schema\n\n| Column | Type | Description |\n|--------|------|-------------|\n\n# Citations\n';
  }
  if (t === 'playbook') {
    return '# Trigger\n\nWhen this applies.\n\n# Steps\n\n1. First step.\n\n# Citations\n';
  }
  return 'Describe the concept here.\n\n# Citations\n';
}
