document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Dropdown Toggle
    document.querySelectorAll('.sidebar .dropdown > a').forEach(dropdown => {
      dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdownContent = dropdown.nextElementSibling;
        const parentDropdown = dropdown.parentElement;
  
        parentDropdown.classList.toggle('active');
  
        document.querySelectorAll('.sidebar .dropdown').forEach(item => {
          if (item !== parentDropdown) {
            item.classList.remove('active');
          }
        });
      });
    });
  
    // Header Dropdown Toggle
    document.querySelectorAll('.nav-links .dropdown > a').forEach(dropdown => {
      dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdownContent = dropdown.nextElementSibling;
        const parentDropdown = dropdown.parentElement;
        parentDropdown.classList.toggle('active');
        document.querySelectorAll('.nav-links .dropdown').forEach(item => {
          if (item !== parentDropdown) item.classList.remove('active');
        });
      });
    });
  });