import { mountPresentation } from '/cbmachinery-demo-preview/explorer/presentation.js';

const photos = {
  double: { src: '/cbmachinery-demo-preview/assets/machine.png', alt: 'C&B double-disc grinder with robotic handling', caption: 'DOUBLE-DISC GRINDING / ROBOTIC HANDLING' },
  clamp: { src: '/cbmachinery-demo-preview/assets/clamp-bore.png', alt: 'C&B clamp-bore face grinding machine', caption: 'CLAMP-BORE FACE GRINDING' }
};
document.querySelectorAll('button[data-equipment]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.equipment;
  const photo = photos[key];
  document.querySelectorAll('button[data-equipment]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const image = document.getElementById('equipment-photo');
  image.src = photo.src;
  image.alt = photo.alt;
  image.dataset.equipment = key;
  document.getElementById('equipment-caption').textContent = photo.caption;
  document.querySelector('.fi-photo-status').textContent = photo.alt;
}));
const host = document.querySelector('[data-machine-presentation]');
if (host) mountPresentation(host);
