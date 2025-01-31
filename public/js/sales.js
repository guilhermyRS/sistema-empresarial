// Função de utilitário para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
  }).format(value);
};

// Função principal para criar vendas
function initializeSalesCreate() {
  console.log('Inicializando criação de vendas...');
  
  const productsContainer = document.getElementById('products-container');
  const addProductBtn = document.getElementById('add-product');
  let productCount = 1;

  function updateTotals() {
      let grandTotal = 0;
      document.querySelectorAll('.product-item').forEach(item => {
          const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
          const unitPrice = parseFloat(item.querySelector('.unit-price-input').value) || 0;
          const total = quantity * unitPrice;
          
          // Atualizar o total do item
          const itemTotalInput = item.querySelector('.item-total');
          if (itemTotalInput) {
              itemTotalInput.value = formatCurrency(total);
          }
          
          grandTotal += total;
      });

      // Atualizar o total geral
      const totalElement = document.getElementById('total-amount');
      if (totalElement) {
          totalElement.textContent = formatCurrency(grandTotal);
      }
  }

  function setupProductListeners(productItem) {
      if (!productItem) return;

      const productSelect = productItem.querySelector('.product-select');
      const quantityInput = productItem.querySelector('.quantity-input');
      const unitPriceInput = productItem.querySelector('.unit-price-input');
      const removeButton = productItem.querySelector('.remove-product');

      if (productSelect) {
          productSelect.addEventListener('change', function() {
              console.log('Produto selecionado:', this.value);
              const option = this.options[this.selectedIndex];
              if (option && option.dataset) {
                  const price = parseFloat(option.dataset.price);
                  const stock = parseInt(option.dataset.stock);
                  
                  if (unitPriceInput) {
                      unitPriceInput.value = price;
                      console.log('Preço definido:', price);
                  }
                  
                  if (quantityInput) {
                      quantityInput.max = stock;
                      quantityInput.value = '1'; // Definir quantidade inicial como 1
                  }
                  
                  updateTotals();
              }
          });
      }

      if (quantityInput) {
          quantityInput.addEventListener('input', function() {
              console.log('Quantidade alterada:', this.value);
              updateTotals();
          });
      }

      if (removeButton) {
          removeButton.addEventListener('click', function() {
              if (document.querySelectorAll('.product-item').length > 1) {
                  productItem.remove();
                  updateTotals();
              }
          });
      }
  }

  if (productsContainer && addProductBtn) {
      console.log('Elementos principais encontrados');
      
      // Configurar item inicial
      const initialItem = productsContainer.querySelector('.product-item');
      if (initialItem) {
          setupProductListeners(initialItem);
      }

      // Configurar botão de adicionar produto
      addProductBtn.addEventListener('click', function() {
          console.log('Adicionando novo produto');
          const template = productsContainer.querySelector('.product-item').cloneNode(true);

          // Limpar valores e atualizar índices
          template.querySelectorAll('[name]').forEach(input => {
              input.name = input.name.replace(/\[\d+\]/, `[${productCount}]`);
              input.value = '';
          });

          // Limpar seleção e totais
          const newSelect = template.querySelector('.product-select');
          if (newSelect) newSelect.selectedIndex = 0;
          
          const newTotal = template.querySelector('.item-total');
          if (newTotal) newTotal.value = formatCurrency(0);

          productsContainer.appendChild(template);
          setupProductListeners(template);
          productCount++;
      });

      // Validação do formulário
      const form = document.getElementById('saleForm');
      if (form) {
          form.addEventListener('submit', function(e) {
              e.preventDefault();
              console.log('Validando formulário...');

              let valid = true;
              let message = '';

              // Validar cliente
              if (!this.client_id.value) {
                  valid = false;
                  message = 'Selecione um cliente';
              }

              // Validar produtos
              const products = document.querySelectorAll('.product-select');
              let hasProduct = false;
              products.forEach(select => {
                  if (select.value) hasProduct = true;
              });

              if (!hasProduct) {
                  valid = false;
                  message = 'Selecione pelo menos um produto';
              }

              // Validar quantidades
              document.querySelectorAll('.product-item').forEach(item => {
                  const select = item.querySelector('.product-select');
                  const quantity = item.querySelector('.quantity-input');

                  if (select.value && quantity.value) {
                      const option = select.options[select.selectedIndex];
                      const stock = parseInt(option.dataset.stock);
                      const qty = parseInt(quantity.value);

                      if (qty > stock) {
                          valid = false;
                          message = `Quantidade insuficiente em estoque para ${option.text}`;
                      }
                  }
              });

              if (!valid) {
                  alert(message);
                  return;
              }

              console.log('Formulário válido, enviando...');
              this.submit();
          });
      }
  }
}

// Função para lista de vendas
function initializeSalesList() {
  console.log('Inicializando lista de vendas...');
  
  // Formatar datas
  document.querySelectorAll('td:first-child').forEach(td => {
      const date = new Date(td.textContent.trim());
      if (!isNaN(date)) {
          td.textContent = date.toLocaleDateString('pt-BR') + ' ' +
                         date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
  });

  // Formatar valores
  document.querySelectorAll('td:nth-child(4)').forEach(td => {
      const value = parseFloat(td.textContent.replace('R$', '').trim());
      if (!isNaN(value)) {
          td.textContent = formatCurrency(value);
      }
  });

  // Configurar filtros de data
  const startDate = document.querySelector('input[name="start_date"]');
  const endDate = document.querySelector('input[name="end_date"]');

  if (startDate && endDate) {
      const today = new Date().toISOString().split('T')[0];
      endDate.max = today;
      startDate.max = today;

      startDate.addEventListener('change', function() {
          endDate.min = this.value;
      });

      endDate.addEventListener('change', function() {
          startDate.max = this.value;
      });
  }
}

// Inicialização baseada na página
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Carregado');
  
  if (document.getElementById('saleForm')) {
      console.log('Página de criação de venda detectada');
      initializeSalesCreate();
  } else if (document.querySelector('.sales-list')) {
      console.log('Página de lista de vendas detectada');
      initializeSalesList();
  }
});