// Main application client scripts
document.addEventListener('DOMContentLoaded', () => {
  // 1. Copy link buttons
  const copyButtons = document.querySelectorAll('.btn-copy-link');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const urlToCopy = btn.getAttribute('data-url') || window.location.href;
      try {
        await navigator.clipboard.writeText(urlToCopy);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-secondary', 'btn-primary-light');
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('btn-success');
          btn.classList.add('btn-outline-secondary');
        }, 2000);
      } catch (err) {
        prompt('Copy this shareable link:', urlToCopy);
      }
    });
  });

  // 2. Dynamic Poll Options Addition
  const optionsContainer = document.getElementById('poll-options-container');
  const addOptionBtn = document.getElementById('btn-add-poll-option');

  if (optionsContainer && addOptionBtn) {
    addOptionBtn.addEventListener('click', () => {
      const currentInputs = optionsContainer.querySelectorAll('.poll-option-input-group');
      const nextIndex = currentInputs.length + 1;

      if (nextIndex > 10) {
        alert('Maximum of 10 options permitted per poll.');
        return;
      }

      const div = document.createElement('div');
      div.className = 'input-group mb-2 poll-option-input-group';
      div.innerHTML = `
        <span class="input-group-text bg-light text-muted">#${nextIndex}</span>
        <input type="text" name="options[]" class="form-control" placeholder="Option ${nextIndex}" required maxlength="255">
        <button type="button" class="btn btn-outline-danger btn-remove-option" title="Remove option">
          <i class="bi bi-x-lg"></i>
        </button>
      `;

      optionsContainer.appendChild(div);

      // Attach remove handler
      div.querySelector('.btn-remove-option').addEventListener('click', () => {
        const remaining = optionsContainer.querySelectorAll('.poll-option-input-group');
        if (remaining.length <= 2) {
          alert('A poll must have at least 2 options.');
          return;
        }
        div.remove();
        // Re-index remaining
        optionsContainer.querySelectorAll('.poll-option-input-group').forEach((group, idx) => {
          group.querySelector('.input-group-text').textContent = `#${idx + 1}`;
          group.querySelector('input').setAttribute('placeholder', `Option ${idx + 1}`);
        });
      });
    });

    // Attach to existing remove buttons
    optionsContainer.querySelectorAll('.btn-remove-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const remaining = optionsContainer.querySelectorAll('.poll-option-input-group');
        if (remaining.length <= 2) {
          alert('A poll must have at least 2 options.');
          return;
        }
        btn.closest('.poll-option-input-group').remove();
        optionsContainer.querySelectorAll('.poll-option-input-group').forEach((group, idx) => {
          group.querySelector('.input-group-text').textContent = `#${idx + 1}`;
          group.querySelector('input').setAttribute('placeholder', `Option ${idx + 1}`);
        });
      });
    });
  }

  // 3. Auto-dismiss flash alerts after 6 seconds
  const autoDismissAlerts = document.querySelectorAll('.alert-dismissible');
  autoDismissAlerts.forEach(alertEl => {
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
      }
    }, 6000);
  });
});
