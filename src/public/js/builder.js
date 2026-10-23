// Survey Builder UI interactions
document.addEventListener('DOMContentLoaded', () => {
  const typeSelect = document.getElementById('questionTypeSelect');
  const optionsGroup = document.getElementById('optionsInputGroup');

  if (typeSelect && optionsGroup) {
    const handleTypeChange = () => {
      const selected = typeSelect.value;
      if (['single_choice', 'multiple_choice'].includes(selected)) {
        optionsGroup.style.display = 'block';
        const textarea = optionsGroup.querySelector('textarea');
        if (textarea) textarea.required = true;
      } else {
        optionsGroup.style.display = 'none';
        const textarea = optionsGroup.querySelector('textarea');
        if (textarea) textarea.required = false;
      }
    };

    typeSelect.addEventListener('change', handleTypeChange);
    handleTypeChange();
  }
});
