const input = document.querySelector('.form-control');
const commentList = document.querySelector('#comment-list');

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
      <button class="reply-btn" data-id="${c._id}">回复</button>
    `;
    if (c.replies.length > 0) {
      li.appendChild(renderTree(c.replies));
    }
    ul.appendChild(li);
  });
  return ul;
}


