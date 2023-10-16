document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('toggle-button'); // Seleciona o botão pelo ID
  var body = document.body; // Seleciona o elemento body

  button.addEventListener('click', function() {
      // Altera a classe do body ao clicar
      body.classList.toggleButton('ligado');
  });
});
