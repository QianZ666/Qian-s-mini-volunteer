const input = document.querySelector('.form-control');
const commentList = document.querySelector('#comment-list');





  const postId = document.getElementById("AcceptBtn")?.dataset.id;

  const btn = document.getElementById("submitVol");
  const acceptBtn = document.getElementById("AcceptBtn");

  // 检查按钮是否存在
  console.log("submitVol button:", btn);
  console.log("AcceptBtn button:", acceptBtn);

  // 点击 Accept 显示表单
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      console.log("✅ Accept button clicked!");
      document.getElementById("volunteerForm").style.display = "block";
    });
  }

  // 点击 Submit 提交表单
  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("✅ Submit button clicked!");

      const name = document.getElementById("volName").value;
      const phone = document.getElementById("volPhone").value;

      try {
        console.log("📡 Sending request to", `/acceptTask/${postId}`, { name, phone });

        const res = await fetch(`/acceptTask/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message);
          acceptBtn.innerText = "Holding";
          acceptBtn.disabled = true;
          document.getElementById("volunteerForm").style.display = "none";

          const statusDiv = document.getElementById("taskStatus");
          if (statusDiv && data.volunteer) {
            statusDiv.innerHTML = `Accepted by ${data.volunteer.name} (phone: ${data.volunteer.phone}) - Status: ${data.volunteer.status}`;
          }
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.error(err);
        alert("request error");
      }
    });
  } else {
    console.error("❌ submitVol button not found!");
  }



input.addEventListener('keyup',function(e) {

  if(e.key === 'Enter' && input.value.trim() !==''){
    addComment(input.value , commentList);
    input.value = '';
  }
});


function addComment(text,container){
  const comment = document.createElement('div');
  comment.classList.add('comment', 'mt-2');
  comment.innerHTML = `
    <img src="https://bootdey.com/img/Content/avatar/avatar2.png" class="profile-photo-sm me-2">
    <span>${input.value}</span>
    <button class="btn btn-link btn-sm reply-btn">reply</button>
    <div class="reply-list ms-4"></div>
  `;

  const replyBtn = comment.querySelector('.reply-btn');
  const replyList = comment.querySelector('.reply-list');

  replyBtn.addEventListener('click', () => {
    // if there is an input so need to add
    if (comment.querySelector('.reply-input')) return;

    const replyInput = document.createElement('input');
    replyInput.type = 'text';
    replyInput.placeholder = 'reply';
    replyInput.classList.add('form-control', 'mt-2', 'reply-input');

    // press Enter to reply
    replyInput.addEventListener('keyup', function (e) {
      if (e.key === 'Enter' && replyInput.value.trim() !== '') {
        const reply = document.createElement('div');
        reply.classList.add('d-flex', 'align-items-center', 'mt-2');
        reply.innerHTML = `
          <img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="profile-photo-sm me-2">
          <span>${replyInput.value}</span>
        `;
        replyList.appendChild(reply);
        addComment(replyInput.value, replyList);
        replyInput.remove(); 
      }
    });

    comment.appendChild(replyInput);
    replyInput.focus();
  });

  commentList.appendChild(comment);
}

async function loadComments(postId) {
  const res = await fetch(`/comment/${postId}`);
  const comments = await res.json();
  renderComments(comments);
}

function renderComments(comments) {
  const container = document.getElementById('comment-list');
  container.innerHTML = '';

  // 递归构建评论树
  function buildTree(parentId) {
    return comments
      .filter(c => String(c.parentId) === String(parentId))
      .map(c => {
        return {
          ...c,
          replies: buildTree(c._id)
        };
      });
  }

  const tree = buildTree(null);
  container.appendChild(renderTree(tree));
}

function renderTree(tree) {
  const ul = document.createElement('ul');
  tree.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${c.userId.username}</strong>: ${c.content}
      <button class="reply-btn" data-id="${c._id}">Reply</button>
    `;
    if (c.replies.length > 0) {
      li.appendChild(renderTree(c.replies));
    }
    ul.appendChild(li);
  });
  return ul;
}


