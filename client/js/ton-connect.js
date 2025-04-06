// File: client/js/ton-connect.js
// Add these functions before the DOMContentLoaded event listener
// File: client/js/ton-connect.js
// Add these functions before the DOMContentLoaded event listener

// Function to verify NFT ownership
async function verifyNFTOwnership(address, collectionAddress, nftIndex) {
    try {
      const response = await fetch('/api/verify-nft-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          collectionAddress: collectionAddress,
          nftIndex: nftIndex
        }),
      });
      
      const data = await response.json();
      return data.owned;
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }
  
  // Function to load NFT image
  async function loadNFTAsPlayerImage(collectionAddress, nftIndex) {
    if (!tonWallet) {
      alert('Please connect your TON wallet first');
      return;
    }
    
    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = '<div class="loading-spinner"></div><p>Verifying NFT ownership...</p>';
    document.body.appendChild(loadingEl);
    
    try {
      // Verify ownership
      const isOwned = await verifyNFTOwnership(
        tonWallet.address,
        collectionAddress,
        nftIndex
      );
      
      if (!isOwned) {
        document.body.removeChild(loadingEl);
        alert('You do not own this NFT');
        return;
      }
      
      // Update loading message
      loadingEl.innerHTML = '<div class="loading-spinner"></div><p>Loading NFT image...</p>';
      
      // Get NFT metadata/image
      const response = await fetch(`/api/get-nft-image?collection=${collectionAddress}&index=${nftIndex}`);
      const data = await response.json();
      
      // Create image object
      loadImage(data.imageUrl, (img) => {
        if (player) {
          player.setCustomImage(img);
          
          // Save to localStorage
          localStorage.setItem('playerCustomImage', data.imageUrl);
        }
        
        document.body.removeChild(loadingEl);
        alert('NFT successfully set as your player image!');
      });
    } catch (error) {
      console.error('Error loading NFT:', error);
      document.body.removeChild(loadingEl);
      alert('Error loading NFT image. Please try again.');
    }
  }
  
  // Function to show NFT selection dialog
  function showNFTSelectionDialog() {
    if (!tonWallet) {
      alert('Please connect your TON wallet first to use NFTs');
      return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'nft-dialog';
    dialog.innerHTML = `
      <div class="nft-dialog-content">
        <h3>Select your NFT</h3>
        <p>Enter your NFT collection address and index:</p>
        
        <div class="nft-input-group">
          <label>Collection Address:</label>
          <input type="text" id="nft-collection-input" placeholder="EQ...">
        </div>
        
        <div class="nft-input-group">
          <label>NFT Index:</label>
          <input type="number" id="nft-index-input" min="0" value="0">
        </div>
        
        <div class="nft-dialog-buttons">
          <button id="nft-cancel-btn" class="cancel-button">Cancel</button>
          <button id="nft-apply-btn" class="apply-button">Apply NFT</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    document.getElementById('nft-cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    document.getElementById('nft-apply-btn').addEventListener('click', () => {
      const collectionAddress = document.getElementById('nft-collection-input').value;
      const nftIndex = document.getElementById('nft-index-input').value;
      
      if (!collectionAddress) {
        alert('Please enter a collection address');
        return;
      }
      
      document.body.removeChild(dialog);
      loadNFTAsPlayerImage(collectionAddress, nftIndex);
    });
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', initTONConnect);
  
// Function to verify NFT ownership
async function verifyNFTOwnership(address, collectionAddress, nftIndex) {
    try {
      const response = await fetch('/api/verify-nft-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          collectionAddress: collectionAddress,
          nftIndex: nftIndex
        }),
      });
      
      const data = await response.json();
      return data.owned;
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }
  
  // Function to load NFT image
  async function loadNFTAsPlayerImage(collectionAddress, nftIndex) {
    if (!tonWallet) {
      alert('Please connect your TON wallet first');
      return;
    }
    
    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = '<div class="loading-spinner"></div><p>Verifying NFT ownership...</p>';
    document.body.appendChild(loadingEl);
    
    try {
      // Verify ownership
      const isOwned = await verifyNFTOwnership(
        tonWallet.address,
        collectionAddress,
        nftIndex
      );
      
      if (!isOwned) {
        document.body.removeChild(loadingEl);
        alert('You do not own this NFT');
        return;
      }
      
      // Update loading message
      loadingEl.innerHTML = '<div class="loading-spinner"></div><p>Loading NFT image...</p>';
      
      // Get NFT metadata/image
      const response = await fetch(`/api/get-nft-image?collection=${collectionAddress}&index=${nftIndex}`);
      const data = await response.json();
      
      // Create image object
      loadImage(data.imageUrl, (img) => {
        if (player) {
          player.setCustomImage(img);
          
          // Save to localStorage
          localStorage.setItem('playerCustomImage', data.imageUrl);
        }
        
        document.body.removeChild(loadingEl);
        alert('NFT successfully set as your player image!');
      });
    } catch (error) {
      console.error('Error loading NFT:', error);
      document.body.removeChild(loadingEl);
      alert('Error loading NFT image. Please try again.');
    }
  }
  
  // Function to show NFT selection dialog
  function showNFTSelectionDialog() {
    if (!tonWallet) {
      alert('Please connect your TON wallet first to use NFTs');
      return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'nft-dialog';
    dialog.innerHTML = `
      <div class="nft-dialog-content">
        <h3>Select your NFT</h3>
        <p>Enter your NFT collection address and index:</p>
        
        <div class="nft-input-group">
          <label>Collection Address:</label>
          <input type="text" id="nft-collection-input" placeholder="EQ...">
        </div>
        
        <div class="nft-input-group">
          <label>NFT Index:</label>
          <input type="number" id="nft-index-input" min="0" value="0">
        </div>
        
        <div class="nft-dialog-buttons">
          <button id="nft-cancel-btn" class="cancel-button">Cancel</button>
          <button id="nft-apply-btn" class="apply-button">Apply NFT</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    document.getElementById('nft-cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    document.getElementById('nft-apply-btn').addEventListener('click', () => {
      const collectionAddress = document.getElementById('nft-collection-input').value;
      const nftIndex = document.getElementById('nft-index-input').value;
      
      if (!collectionAddress) {
        alert('Please enter a collection address');
        return;
      }
      
      document.body.removeChild(dialog);
      loadNFTAsPlayerImage(collectionAddress, nftIndex);
    });
  }
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', initTONConnect);  