export function escapeHtml(value){
  return String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

export function formatEventDate(value){
  if(!value) return 'Tanggal belum diatur';
  const date = new Date(value + 'T00:00:00');
  if(Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
}

export function toTimeInputValue(value){
  const match = String(value || '').match(/(\d{1,2})[:.](\d{2})/);
  if(!match) return '';
  return match[1].padStart(2, '0') + ':' + match[2];
}

export function formatDateTimeId(dateValue, timeValue){
  if(!dateValue || !timeValue) return '';
  const date = new Date(`${dateValue}T${timeValue}:00`);
  if(Number.isNaN(date.getTime())) return '';
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
  return `${datePart} ${timeValue}`;
}

export function compressToBase64(file, maxW, quality){
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
