function toggleVisibility() {
  const logIn = document.getElementsByClassName("log-in")[0];
  const signUp = document.getElementsByClassName("sign-up")[0];

  logIn.classList.toggle("hidden");
  signUp.classList.toggle("hidden");
}

function deleteFolder(folderId) {
  console.log(folderId);
  fetch(`/folder/${folderId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      console.log("response received");
      if (response.ok) {
        document.getElementById(`folder-${folderId}`).remove();
      } else {
        alert("Error deleting folder");
      }
    })
    .catch((err) => console.error(err));
}
