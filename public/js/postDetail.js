// Wait for the page to load
document.addEventListener('DOMContentLoaded', () => {
  const acceptBtn = document.getElementById('acceptBtn');
  const volunteerForm = document.getElementById('volunteerForm');
  const acceptForm = document.getElementById('acceptForm');

  // When "Accept" button is clicked, show the form
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      volunteerForm.style.display = 'block';
      acceptBtn.style.display = 'none';
    });
  }

  // When form is submitted
  if (acceptForm) {
    acceptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const postId = acceptForm.getAttribute('data-postid');
      const formData = new FormData(acceptForm);
      const name = formData.get('name');
      const phone = formData.get('phone');

      try {
        const res = await fetch(`/acceptTask/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, phone }),
        });

        const result = await res.text();
        alert(result);
        // Refresh the page to show new status
        location.reload();
      } catch (err) {
        alert('Failed to accept task');
        console.error(err);
      }
    });
  }
});
