
  // add event listenner
  document.getElementById('uploadBtn').addEventListener('click', function () {
    document.getElementById('photo').click();
  });

  // previes phote
  document.getElementById('photo').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById('photoPreview');
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }
  });
