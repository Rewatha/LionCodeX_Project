// Global variables
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let ordersPerPage = 10;
let currentOrderId = null;
let isEditMode = false;

// Sample orders data (replace with API calls in production)
const sampleOrders = [
    {
        id: 'ORD-2025-001',
        customerName: 'Rajesh Patel',
        customerEmail: 'rajesh@example.com',
        customerPhone: '+94 77 123 4567',
        customerAddress: 'No. 45, Galle Road, Colombo 03',
        serviceType: 'roof',
        projectArea: 150,
        scheduledDate: '2025-02-15',
        orderDate: '2025-01-20',
        status: 'confirmed',
        priority: 'normal',
        basePrice: 75000,
        additionalCharges: 5000,
        discount: 5,
        totalAmount: 76000,
        serviceDescription: 'Complete roof waterproofing with premium coating',
        orderNotes: 'Customer prefers eco-friendly materials',
        assignedTechnician: 'tech1',
        estimatedDuration: 3,
        statusHistory: [
            { status: 'pending', date: '2025-01-20', notes: 'Order received and under review' },
            { status: 'confirmed', date: '2025-01-21', notes: 'Order confirmed, materials scheduled' }
        ]
    },
    {
        id: 'ORD-2025-002',
        customerName: 'Priya Fernando',
        customerEmail: 'priya@example.com',
        customerPhone: '+94 70 987 6543',
        customerAddress: 'No. 78, Kandy Road, Peradeniya',
        serviceType: 'bathroom',
        projectArea: 25,
        scheduledDate: '2025-02-10',
        orderDate: '2025-01-18',
        status: 'in-progress',
        priority: 'normal',
        basePrice: 35000,
        additionalCharges: 2000,
        discount: 0,
        totalAmount: 37000,
        serviceDescription: 'Bathroom waterproofing with tile work',
        orderNotes: 'Include shower area waterproofing',
        assignedTechnician: 'tech2',
        estimatedDuration: 2,
        statusHistory: [
            { status: 'pending', date: '2025-01-18', notes: 'Initial order placement' },
            { status: 'confirmed', date: '2025-01-19', notes: 'Order confirmed' },
            { status: 'in-progress', date: '2025-02-08', notes: 'Work started on site' }
        ]
    },
    {
        id: 'ORD-2025-003',
        customerName: 'Kamal Silva',
        customerEmail: 'kamal@example.com',
        customerPhone: '+94 76 555 1234',
        customerAddress: 'No. 123, Negombo Road, Gampaha',
        serviceType: 'foundation',
        projectArea: 200,
        scheduledDate: '2025-01-25',
        orderDate: '2025-01-15',
        status: 'completed',
        priority: 'urgent',
        basePrice: 120000,
        additionalCharges: 8000,
        discount: 10,
        totalAmount: 115200,
        serviceDescription: 'Foundation waterproofing with drainage system',
        orderNotes: 'Emergency repair after water damage',
        assignedTechnician: 'tech1',
        estimatedDuration: 5,
        statusHistory: [
            { status: 'pending', date: '2025-01-15', notes: 'Emergency order received' },
            { status: 'confirmed', date: '2025-01-15', notes: 'Priority order confirmed' },
            { status: 'in-progress', date: '2025-01-22', notes: 'Work commenced' },
            { status: 'completed', date: '2025-01-30', notes: 'Work completed successfully' }
        ]
    },
    {
        id: 'ORD-2025-004',
        customerName: 'Lisa Wong',
        customerEmail: 'lisa@example.com',
        customerPhone: '+94 71 246 8135',
        customerAddress: 'No. 56, Matara Road, Galle',
        serviceType: 'wall',
        projectArea: 80,
        scheduledDate: '2025-02-20',
        orderDate: '2025-01-22',
        status: 'pending',
        priority: 'normal',
        basePrice: 45000,
        additionalCharges: 0,
        discount: 0,
        totalAmount: 45000,
        serviceDescription: 'External wall waterproofing treatment',
        orderNotes: 'Weather dependent scheduling',
        assignedTechnician: 'tech3',
        estimatedDuration: 2,
        statusHistory: [
            { status: 'pending', date: '2025-01-22', notes: 'Order received, waiting for site survey' }
        ]
    },
    {
        id: 'ORD-2025-005',
        customerName: 'David Perera',
        customerEmail: 'david@example.com',
        customerPhone: '+94 75 369 2580',
        customerAddress: 'No. 89, Kurunegala Road, Puttalam',
        serviceType: 'commercial',
        projectArea: 500,
        scheduledDate: '2025-03-01',
        orderDate: '2025-01-25',
        status: 'confirmed',
        priority: 'normal',
        basePrice: 250000,
        additionalCharges: 15000,
        discount: 8,
        totalAmount: 243800,
        serviceDescription: 'Commercial building comprehensive waterproofing',
        orderNotes: 'Large project requiring multiple phases',
        assignedTechnician: 'tech4',
        estimatedDuration: 10,
        statusHistory: [
            { status: 'pending', date: '2025-01-25', notes: 'Commercial project proposal submitted' },
            { status: 'confirmed', date: '2025-01-28', notes: 'Contract signed and confirmed' }
        ]
    }
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    initializeEventListeners();
    updateOrderStats();
});

// Load and display orders
function loadOrders() {
    // In production, this would be an API call
    allOrders = [...sampleOrders];
    filteredOrders = [...allOrders];
    displayOrders();
}

// Initialize event listeners
function initializeEventListeners() {
    // Filter listeners
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('serviceFilter').addEventListener('change', filterOrders);
    document.getElementById('dateRange').addEventListener('change', filterOrders);
    
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('orderSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Order form listeners
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmission);
        
        // Auto-calculate total amount
        ['basePrice', 'additionalCharges', 'discount'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', calculateTotalAmount);
            }
        });
    }

    // Status form listener
    const statusForm = document.getElementById('statusForm');
    if (statusForm) {
        statusForm.addEventListener('submit', handleStatusUpdate);
    }
}

// Filter orders based on selected criteria
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;
    const dateRange = document.getElementById('dateRange').value;

    filteredOrders = allOrders.filter(order => {
        let matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        let matchesService = serviceFilter === 'all' || order.serviceType === serviceFilter;
        let matchesDate = true;

        if (dateRange !== 'all') {
            const orderDate = new Date(order.orderDate);
            const now = new Date();
            
            switch (dateRange) {
                case 'today':
                    matchesDate = orderDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = orderDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    matchesDate = orderDate >= monthAgo;
                    break;
                case 'quarter':
                    const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    matchesDate = orderDate >= quarterAgo;
                    break;
            }
        }

        return matchesStatus && matchesService && matchesDate;
    });

    currentPage = 1;
    displayOrders();
    updateOrderStats();
}

// Perform search functionality
function performSearch() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filterOrders(); // Reset to current filters
        return;
    }

    filteredOrders = allOrders.filter(order => {
        return order.id.toLowerCase().includes(searchTerm) ||
               order.customerName.toLowerCase().includes(searchTerm) ||
               order.customerEmail.toLowerCase().includes(searchTerm) ||
               order.customerPhone.includes(searchTerm);
    });

    currentPage = 1;
    displayOrders();
}

// Display orders in the table
function displayOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);

    if (ordersToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                        <h3>No orders found</h3>
                        <p>Try adjusting your filters or search criteria</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = ordersToShow.map(order => createOrderRow(order)).join('');
    }

    updatePagination();
}

// Create HTML for order table row
function createOrderRow(order) {
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial'
    };

    const priorityIcon = order.priority === 'emergency' ? '<i class="fas fa-exclamation-triangle" style="color: #dc3545;" title="Emergency"></i> ' :
                        order.priority === 'urgent' ? '<i class="fas fa-clock" style="color: #ffc107;" title="Urgent"></i> ' : '';

    return `
        <tr>
            <td>
                <span class="order-id" onclick="viewOrderDetails('${order.id}')">
                    ${priorityIcon}${order.id}
                </span>
            </td>
            <td>
                <div>
                    <strong>${order.customerName}</strong><br>
                    <small>${order.customerEmail}</small>
                </div>
            </td>
            <td>${serviceNames[order.serviceType] || order.serviceType}</td>
            <td>${order.customerAddress.split(',')[0]}...</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status.replace('-', ' ').toUpperCase()}
                </span>
            </td>
            <td>
                <span class="order-amount">
                    LKR ${order.totalAmount.toLocaleString()}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-view" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn-small btn-edit" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn-small btn-status" onclick="updateOrderStatus('${order.id}')">
                        <i class="fas fa-tasks"></i>
                        Status
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayOrders();
}

// Update order statistics
function updateOrderStats() {
    const pendingCount = allOrders.filter(order => order.status === 'pending').length;
    const confirmedCount = allOrders.filter(order => order.status === 'confirmed').length;
    const inProgressCount = allOrders.filter(order => order.status === 'in-progress').length;
    const completedCount = allOrders.filter(order => order.status === 'completed').length;

    document.getElementById('pendingOrdersCount').textContent = pendingCount;
    document.getElementById('confirmedOrdersCount').textContent = confirmedCount;
    document.getElementById('inProgressOrdersCount').textContent = inProgressCount;
    document.getElementById('completedOrdersCount').textContent = completedCount;
}

// View order details
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    const technicianNames = {
        'tech1': 'Sunil Perera',
        'tech2': 'Kamal Silva',
        'tech3': 'Nimal Fernando',
        'tech4': 'Ravi Kumar'
    };

    const orderDetailsHTML = `
        <div class="detail-section">
            <h3>Order Information</h3>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${order.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Scheduled Date:</span>
                <span class="detail-value">${new Date(order.scheduledDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${order.priority.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-${order.status}">
                        ${order.status.replace('-', ' ').toUpperCase()}
                    </span>
                </span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Customer Information</h3>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${order.customerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${order.customerEmail}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${order.customerPhone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${order.customerAddress}</span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Service Details</h3>
            <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">${serviceNames[order.serviceType]}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Project Area:</span>
                <span class="detail-value">${order.projectArea} sq ft</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Estimated Duration:</span>
                <span class="detail-value">${order.estimatedDuration} days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Assigned Technician:</span>
                <span class="detail-value">${technicianNames[order.assignedTechnician] || 'Not Assigned'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${order.serviceDescription}</span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Pricing Details</h3>
            <div class="detail-row">
                <span class="detail-label">Base Price:</span>
                <span class="detail-value">LKR ${order.basePrice.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Additional Charges:</span>
                <span class="detail-value">LKR ${order.additionalCharges.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Discount:</span>
                <span class="detail-value">${order.discount}%</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value"><strong>LKR ${order.totalAmount.toLocaleString()}</strong></span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Status Timeline</h3>
            <div class="status-timeline">
                ${order.statusHistory.map(item => `
                    <div class="timeline-item ${item.status}">
                        <div class="timeline-icon ${item.status}">
                            <i class="fas fa-${getStatusIcon(item.status)}"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>${item.status.replace('-', ' ').toUpperCase()}</h4>
                            <p>${item.notes}</p>
                        </div>
                        <div class="timeline-date">
                            ${new Date(item.date).toLocaleDateString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${order.orderNotes ? `
        <div class="detail-section">
            <h3>Additional Notes</h3>
            <p style="color: #666; line-height: 1.6;">${order.orderNotes}</p>
        </div>
        ` : ''}
    `;

    document.getElementById('orderDetails').innerHTML = orderDetailsHTML;
    document.getElementById('orderModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'pending': 'clock',
        'confirmed': 'check-circle',
        'in-progress': 'tools',
        'completed': 'trophy',
        'cancelled': 'times-circle'
    };
    return icons[status] || 'circle';
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Show create order modal
function showCreateOrder() {
    isEditMode = false;
    currentOrderId = null;
    document.getElementById('orderFormTitle').textContent = 'Create New Order';
    document.getElementById('orderForm').reset();
    setMinDate();
    document.getElementById('createOrderModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Edit order
function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    isEditMode = true;
    currentOrderId = orderId;
    document.getElementById('orderFormTitle').textContent = 'Edit Order';

    // Populate form with order data
    document.getElementById('customerName').value = order.customerName;
    document.getElementById('customerEmail').value = order.customerEmail;
    document.getElementById('customerPhone').value = order.customerPhone;
    document.getElementById('customerAddress').value = order.customerAddress;
    document.getElementById('serviceType').value = order.serviceType;
    document.getElementById('projectArea').value = order.projectArea;
    document.getElementById('scheduledDate').value = order.scheduledDate;
    document.getElementById('priority').value = order.priority;
    document.getElementById('serviceDescription').value = order.serviceDescription;
    document.getElementById('basePrice').value = order.basePrice;
    document.getElementById('additionalCharges').value = order.additionalCharges;
    document.getElementById('discount').value = order.discount;
    document.getElementById('orderNotes').value = order.orderNotes || '';
    document.getElementById('assignedTechnician').value = order.assignedTechnician || '';
    document.getElementById('estimatedDuration').value = order.estimatedDuration;

    calculateTotalAmount();
    document.getElementById('createOrderModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close create order modal
function closeCreateOrderModal() {
    document.getElementById('createOrderModal').classList.remove('show');
    document.body.style.overflow = 'auto';
    document.getElementById('orderForm').reset();
    isEditMode = false;
    currentOrderId = null;
}

// Calculate total amount
function calculateTotalAmount() {
    const basePrice = parseFloat(document.getElementById('basePrice').value) || 0;
    const additionalCharges = parseFloat(document.getElementById('additionalCharges').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    const subtotal = basePrice + additionalCharges;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    document.getElementById('totalAmount').value = total.toFixed(2);
}

// Set minimum date for scheduled date
function setMinDate() {
    const scheduledDateInput = document.getElementById('scheduledDate');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    scheduledDateInput.min = tomorrow.toISOString().split('T')[0];
}

// Handle order form submission
function handleOrderSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const orderData = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone'),
        customerAddress: formData.get('customerAddress'),
        serviceType: formData.get('serviceType'),
        projectArea: parseInt(formData.get('projectArea')),
        scheduledDate: formData.get('scheduledDate'),
        priority: formData.get('priority'),
        serviceDescription: formData.get('serviceDescription'),
        basePrice: parseFloat(formData.get('basePrice')),
        additionalCharges: parseFloat(formData.get('additionalCharges')),
        discount: parseFloat(formData.get('discount')),
        totalAmount: parseFloat(formData.get('totalAmount')),
        orderNotes: formData.get('orderNotes'),
        assignedTechnician: formData.get('assignedTechnician'),
        estimatedDuration: parseInt(formData.get('estimatedDuration'))
    };

    // Validate required fields
    const requiredFields = ['customerName', 'customerEmail', 'customerPhone', 'customerAddress', 'serviceType', 'scheduledDate', 'serviceDescription'];
    for (const field of requiredFields) {
        if (!orderData[field]) {
            showAlert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, 'error');
            return;
        }
    }

    if (isEditMode && currentOrderId) {
        // Update existing order
        const orderIndex = allOrders.findIndex(o => o.id === currentOrderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex] = { ...allOrders[orderIndex], ...orderData };
            showAlert('Order updated successfully!', 'success');
        }
    } else {
        // Create new order
        const newOrder = {
            id: generateOrderId(),
            ...orderData,
            orderDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                    notes: 'Order created and pending review'
                }
            ]
        };

        allOrders.unshift(newOrder);
        showAlert('Order created successfully!', 'success');
    }

    // Refresh display
    filterOrders();
    closeCreateOrderModal();
}

// Generate order ID
function generateOrderId() {
    const year = new Date().getFullYear();
    const orderNumber = (allOrders.length + 1).toString().padStart(3, '0');
    return `ORD-${year}-${orderNumber}`;
}

// Update order status
function updateOrderStatus(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('statusOrderId').value = orderId;
    document.getElementById('newStatus').value = order.status;
    document.getElementById('statusModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close status modal
function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('show');
    document.body.style.overflow = 'auto';
    document.getElementById('statusForm').reset();
}

// Handle status update
function handleStatusUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const orderId = formData.get('orderId');
    const newStatus = formData.get('status');
    const statusNotes = formData.get('statusNotes');
    const notifyCustomer = formData.get('notifyCustomer') === 'on';

    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status
    order.status = newStatus;
    
    // Add to status history
    order.statusHistory.push({
        status: newStatus,
        date: new Date().toISOString().split('T')[0],
        notes: statusNotes || `Status updated to ${newStatus.replace('-', ' ')}`
    });

    // Show success message
    let message = `Order ${orderId} status updated to ${newStatus.replace('-', ' ').toUpperCase()}`;
    if (notifyCustomer) {
        message += '. Customer notification sent.';
    }
    showAlert(message, 'success');

    // Refresh display
    filterOrders();
    closeStatusModal();

    // In production, send notification to customer if requested
    if (notifyCustomer) {
        console.log(`Notification sent to ${order.customerEmail} about status update`);
    }
}

// Export orders
function exportOrders() {
    const dataToExport = filteredOrders.map(order => ({
        'Order ID': order.id,
        'Customer Name': order.customerName,
        'Email': order.customerEmail,
        'Phone': order.customerPhone,
        'Service Type': order.serviceType,
        'Order Date': order.orderDate,
        'Scheduled Date': order.scheduledDate,
        'Status': order.status,
        'Priority': order.priority,
        'Total Amount': order.totalAmount,
        'Address': order.customerAddress
    }));

    // Convert to CSV
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Orders exported successfully!', 'success');
}

// Show alert messages
function showAlert(message, type = 'info') {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert ${type} show`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (modal.id === 'orderModal') {
                closeOrderModal();
            } else if (modal.id === 'createOrderModal') {
                closeCreateOrderModal();
            } else if (modal.id === 'statusModal') {
                closeStatusModal();
            }
        });
    }
});

// Close modals on backdrop click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'orderModal') {
            closeOrderModal();
        } else if (e.target.id === 'createOrderModal') {
            closeCreateOrderModal();
        } else if (e.target.id === 'statusModal') {
            closeStatusModal();
        }
    }
});

// Print order details
function printOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const printWindow = window.open('', '_blank');
    const serviceNames = {
        'roof': 'Roof Waterproofing',
        'wall': 'Wall Waterproofing',
        'foundation': 'Foundation Waterproofing',
        'bathroom': 'Bathroom Waterproofing',
        'basement': 'Basement Waterproofing',
        'commercial': 'Commercial Waterproofing'
    };

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Details - ${order.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .section { margin-bottom: 25px; }
                .section h3 { background: #f0f0f0; padding: 10px; margin: 0 0 15px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
                .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-confirmed { background: #d1ecf1; color: #0c5460; }
                .status-in-progress { background: #d1ecf1; color: #004085; }
                .status-completed { background: #d4edda; color: #155724; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SealTech Engineering</h1>
                <h2>Order Details</h2>
                <p>Order ID: ${order.id}</p>
            </div>
            
            <div class="section">
                <h3>Order Information</h3>
                <div class="detail-row"><span>Order Date:</span><span>${new Date(order.orderDate).toLocaleDateString()}</span></div>
                <div class="detail-row"><span>Scheduled Date:</span><span>${new Date(order.scheduledDate).toLocaleDateString()}</span></div>
                <div class="detail-row"><span>Priority:</span><span>${order.priority.toUpperCase()}</span></div>
                <div class="detail-row"><span>Status:</span><span class="status-badge status-${order.status}">${order.status.replace('-', ' ').toUpperCase()}</span></div>
            </div>
            
            <div class="section">
                <h3>Customer Information</h3>
                <div class="detail-row"><span>Name:</span><span>${order.customerName}</span></div>
                <div class="detail-row"><span>Email:</span><span>${order.customerEmail}</span></div>
                <div class="detail-row"><span>Phone:</span><span>${order.customerPhone}</span></div>
                <div class="detail-row"><span>Address:</span><span>${order.customerAddress}</span></div>
            </div>
            
            <div class="section">
                <h3>Service Details</h3>
                <div class="detail-row"><span>Service Type:</span><span>${serviceNames[order.serviceType]}</span></div>
                <div class="detail-row"><span>Project Area:</span><span>${order.projectArea} sq ft</span></div>
                <div class="detail-row"><span>Description:</span><span>${order.serviceDescription}</span></div>
            </div>
            
            <div class="section">
                <h3>Pricing</h3>
                <div class="detail-row"><span>Base Price:</span><span>LKR ${order.basePrice.toLocaleString()}</span></div>
                <div class="detail-row"><span>Additional Charges:</span><span>LKR ${order.additionalCharges.toLocaleString()}</span></div>
                <div class="detail-row"><span>Discount:</span><span>${order.discount}%</span></div>
                <div class="detail-row"><strong><span>Total Amount:</span><span>LKR ${order.totalAmount.toLocaleString()}</span></strong></div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    }
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Delete order (with confirmation)
function deleteOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    if (confirm(`Are you sure you want to delete order ${orderId}?\n\nCustomer: ${order.customerName}\nService: ${order.serviceType}\n\nThis action cannot be undone.`)) {
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        allOrders.splice(orderIndex, 1);
        
        filterOrders();
        showAlert('Order deleted successfully!', 'success');
    }
}

// Duplicate order
function duplicateOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const duplicatedOrder = {
        ...order,
        id: generateOrderId(),
        orderDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        statusHistory: [
            {
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                notes: `Order duplicated from ${orderId}`
            }
        ]
    };

    // Set scheduled date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    duplicatedOrder.scheduledDate = tomorrow.toISOString().split('T')[0];

    allOrders.unshift(duplicatedOrder);
    filterOrders();
    showAlert(`Order duplicated successfully! New Order ID: ${duplicatedOrder.id}`, 'success');
}

// Auto-save draft orders (simulated)
let draftSaveTimeout;
function saveDraft() {
    clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(() => {
        const formData = new FormData(document.getElementById('orderForm'));
        const draftData = {};
        
        formData.forEach((value, key) => {
            draftData[key] = value;
        });
        
        if (Object.keys(draftData).length > 0 && draftData.customerName) {
            localStorage.setItem('orderDraft', JSON.stringify(draftData));
            console.log('Draft saved automatically');
        }
    }, 2000);
}

// Load draft on form open
function loadDraft() {
    const savedDraft = localStorage.getItem('orderDraft');
    if (savedDraft && !isEditMode) {
        try {
            const draftData = JSON.parse(savedDraft);
            
            if (confirm('A draft order was found. Would you like to restore it?')) {
                Object.keys(draftData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = draftData[key];
                    }
                });
                
                calculateTotalAmount();
                showAlert('Draft restored successfully!', 'info');
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }
}

// Clear draft when order is submitted
function clearDraft() {
    localStorage.removeItem('orderDraft');
}

// Add input listeners for auto-save
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('input', saveDraft);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N for new order
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.target.closest('.modal')) {
        e.preventDefault();
        showCreateOrder();
    }
    
    // Ctrl/Cmd + F for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.target.closest('.modal')) {
        e.preventDefault();
        document.getElementById('orderSearch').focus();
    }
    
    // Ctrl/Cmd + E for export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.target.closest('.modal')) {
        e.preventDefault();
        exportOrders();
    }
});

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),
    
    logLoadTime: function() {
        const loadTime = Date.now() - this.startTime;
        console.log(`Orders page loaded in ${loadTime}ms`);
        
        if (loadTime > 3000) {
            console.warn('Page load time exceeded 3 seconds');
        }
    },
    
    measureFunction: function(funcName, func) {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            console.log(`${funcName} executed in ${end - start}ms`);
            return result;
        };
    }
};

// Initialize performance monitoring
window.addEventListener('load', () => {
    performanceMonitor.logLoadTime();
});

// Measure key functions (wrap them)
displayOrders = performanceMonitor.measureFunction('displayOrders', displayOrders);
filterOrders = performanceMonitor.measureFunction('filterOrders', filterOrders);
        