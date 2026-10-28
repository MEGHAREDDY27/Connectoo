(function () {
  'use strict';

  var modal = document.getElementById('image-modal');
  var image = document.getElementById('image-modal-content');
  var closeButton = document.getElementById('image-modal-close');
  if (!modal || !image || !closeButton) return;

  document.querySelectorAll('.image-modal-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      image.src = trigger.getAttribute('data-image-src');
      image.alt = trigger.getAttribute('data-image-alt') || 'Expanded image';
      modal.showModal();
    });
  });

  closeButton.addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (event) {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener('close', function () {
    image.removeAttribute('src');
    image.alt = '';
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.open) modal.close();
  });
})();
