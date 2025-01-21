let adminToken = '';
async function updateQueue() {
    const response = await fetch('/api/tokens');
    const tokens = await response.json();
    
    const queueDisplay = document.getElementById('queueDisplay');
    queueDisplay.innerHTML = '';
    
    tokens.forEach(token => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded';
        div.innerHTML = `
            <div>
                <span class="font-semibold">Token #${token.number}</span>
                <span class="ml-4">${token.customerName}</span>
            </div>
            ${adminToken ? `
                <button 
                    onclick="completeToken('${token._id}')"
                    class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                    Complete
                </button>
            ` : ''}
        `;
        queueDisplay.appendChild(div);
    });
}

// Handle token form submission
document.getElementById('tokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerName = document.getElementById('customerName').value;
    
    try {
        const response = await fetch('/api/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customerName })
        });
        
        const token = await response.json();
        alert(`Your token number is: ${token.number}`);
        document.getElementById('customerName').value = '';
        updateQueue();
    } catch (error) {
        alert('Error getting token');
    }
});

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Handle admin login
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.token) {
      adminToken = data.token;
      document.getElementById("adminControls").classList.remove("hidden");
      document.getElementById("adminLoginForm").reset();
      updateQueue();
    } else {
      alert("Login failed");
    }
  } catch (error) {
    alert("Login failed");
  }
});


document.getElementById('clearQueue').addEventListener('click', async () => {
  if (!confirm("Are you sure you want to clear the queue?")) return;
  //handle clear queue
  try {
    await fetch("/api/tokens", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    updateQueue();
  } catch (error) {
    alert("Error clearing queue");
  }
});


async function completeToken(id) {
    try {
        await fetch(`/api/tokens/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        updateQueue();
    } catch (error) {
        alert('Error completing token');
    }// Handle completing individual tokens
}

// Update queue every 5 secs
updateQueue();
setInterval(updateQueue, 5000);