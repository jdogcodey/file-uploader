function toggleVisibility(eleOne, eleTwo) {
  const firstEle = document.getElementById(eleOne);
  const secondEle = document.getElementById(eleTwo);

  firstEle.classList.toggle("hidden");
  secondEle.classList.toggle("hidden");
}

function deleteFolder(folderId) {
  if (
    window.confirm(
      "This action will delete all associated documents. Are you sure you want to proceed?"
    )
  ) {
    console.log(folderId);
    fetch(`/folder/${folderId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (response.ok) {
          document.getElementById(`folder-${folderId}`).remove();
        } else {
          alert("Error deleting folder");
        }
      })
      .catch((err) => console.error(err));
  } else {
    alert("Folder deletion cancelled.");
  }
}

function deleteDocument(documentId) {
  fetch(`/document/${documentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (response.ok) {
        document.getElementById(`document-${documentId}`).remove();
      } else {
        alert("Error deleting document");
      }
    })
    .catch((err) => console.error(err));
}

function showError(errors, field) {
  return erros
    ? errors
        .filter((error) => error.path === field)
        .map((error) => error.msg)
        .join("<br>")
    : "";
}
