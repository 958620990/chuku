// 数据存储
let inventory = JSON.parse(localStorage.getItem('kindergarten_inventory')) || [];
let records = JSON.parse(localStorage.getItem('kindergarten_records')) || [];

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 初始化标签页切换
    initTabSwitching();
    
    // 初始化表单事件
    initFormEvents();
    
    // 渲染初始数据
    renderInventory();
    renderRecords();
    updateItemSelects();
    
    // 初始化搜索和过滤
    initSearchAndFilter();
    
    // 添加一些示例数据（如果没有数据的话）
    if (inventory.length === 0) {
        addSampleData();
    }
}

// 标签页切换
function initTabSwitching() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // 移除所有活动状态
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加活动状态
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 表单事件初始化
function initFormEvents() {
    // 添加物品表单
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
    
    // 入库表单
    document.getElementById('inboundForm').addEventListener('submit', handleInbound);
    
    // 出库表单
    document.getElementById('outboundForm').addEventListener('submit', handleOutbound);
}

// 搜索和过滤初始化
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const recordTypeFilter = document.getElementById('recordTypeFilter');
    const recordDateFilter = document.getElementById('recordDateFilter');
    
    searchInput.addEventListener('input', renderInventory);
    categoryFilter.addEventListener('change', renderInventory);
    recordTypeFilter.addEventListener('change', renderRecords);
    recordDateFilter.addEventListener('change', renderRecords);
}

// 添加物品
function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        unit: document.getElementById('itemUnit').value,
        description: document.getElementById('itemDescription').value,
        quantity: 0,
        createdAt: new Date().toISOString()
    };
    
    inventory.push(newItem);
    saveData();
    renderInventory();
    updateItemSelects();
    closeAddItemModal();
    showMessage('物品添加成功！', 'success');
    
    // 重置表单
    e.target.reset();
}

// 入库处理
function handleInbound(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('inboundItem').value;
    const quantity = parseInt(document.getElementById('inboundQuantity').value);
    const reason = document.getElementById('inboundReason').value;
    const note = document.getElementById('inboundNote').value;
    
    // 更新库存
    const item = inventory.find(item => item.id === itemId);
    if (item) {
        item.quantity += quantity;
        
        // 添加记录
        const record = {
            id: Date.now().toString(),
            type: '入库',
            itemId: itemId,
            itemName: item.name,
            quantity: quantity,
            reason: reason,
            note: note,
            timestamp: new Date().toISOString(),
            operator: '系统管理员'
        };
        
        records.unshift(record);
        saveData();
        renderInventory();
        renderRecords();
        showMessage(`${item.name} 入库成功！数量：${quantity}${item.unit}`, 'success');
        
        // 重置表单
        e.target.reset();
    }
}

// 出库处理
function handleOutbound(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('outboundItem').value;
    const quantity = parseInt(document.getElementById('outboundQuantity').value);
    const className = document.getElementById('outboundClass').value;
    const teacher = document.getElementById('outboundTeacher').value;
    const note = document.getElementById('outboundNote').value;
    
    // 检查库存
    const item = inventory.find(item => item.id === itemId);
    if (item) {
        if (item.quantity < quantity) {
            showMessage(`库存不足！当前库存：${item.quantity}${item.unit}`, 'error');
            return;
        }
        
        // 更新库存
        item.quantity -= quantity;
        
        // 添加记录
        const record = {
            id: Date.now().toString(),
            type: '出库',
            itemId: itemId,
            itemName: item.name,
            quantity: quantity,
            className: className,
            teacher: teacher,
            note: note,
            timestamp: new Date().toISOString(),
            operator: '系统管理员'
        };
        
        records.unshift(record);
        saveData();
        renderInventory();
        renderRecords();
        showMessage(`${item.name} 出库成功！数量：${quantity}${item.unit}`, 'success');
        
        // 重置表单
        e.target.reset();
    }
}

// 渲染库存
function renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                            item.id.includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    grid.innerHTML = filteredInventory.map(item => {
        const stockStatus = getStockStatus(item.quantity);
        return `
            <div class="inventory-item fade-in">
                <h3>${item.name}</h3>
                <div class="item-info">
                    <span><strong>编号：</strong>${item.id}</span>
                    <span><strong>分类：</strong>${item.category}</span>
                    <span><strong>库存：</strong>
                        <span class="quantity-display ${stockStatus.class}">
                            <span class="status-indicator ${stockStatus.class}"></span>
                            ${item.quantity} ${item.unit}
                        </span>
                    </span>
                    ${item.description ? `<span><strong>描述：</strong>${item.description}</span>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="quickInbound('${item.id}')">快速入库</button>
                    <button class="btn btn-warning" onclick="quickOutbound('${item.id}')">快速出库</button>
                    <button class="btn btn-danger" onclick="deleteItem('${item.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 获取库存状态
function getStockStatus(quantity) {
    if (quantity === 0) {
        return { class: 'low', text: '缺货' };
    } else if (quantity <= 5) {
        return { class: 'medium', text: '库存不足' };
    } else {
        return { class: 'high', text: '库存充足' };
    }
}

// 渲染记录
function renderRecords() {
    const container = document.getElementById('recordsContainer');
    const typeFilter = document.getElementById('recordTypeFilter').value;
    const dateFilter = document.getElementById('recordDateFilter').value;
    
    let filteredRecords = records.filter(record => {
        const matchesType = !typeFilter || record.type === typeFilter;
        const matchesDate = !dateFilter || 
                          new Date(record.timestamp).toDateString() === new Date(dateFilter).toDateString();
        return matchesType && matchesDate;
    });
    
    if (filteredRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无记录</p>';
        return;
    }
    
    container.innerHTML = filteredRecords.map(record => `
        <div class="record-item ${record.type === '入库' ? 'inbound' : 'outbound'} fade-in">
            <div class="record-header">
                <div>
                    <span class="record-type ${record.type === '入库' ? 'inbound' : 'outbound'}">${record.type}</span>
                    <strong>${record.itemName}</strong>
                </div>
                <span>${formatDateTime(record.timestamp)}</span>
            </div>
            <div class="record-details">
                <p><strong>数量：</strong>${record.quantity}</p>
                ${record.reason ? `<p><strong>原因：</strong>${record.reason}</p>` : ''}
                ${record.className ? `<p><strong>班级：</strong>${record.className}</p>` : ''}
                ${record.teacher ? `<p><strong>老师：</strong>${record.teacher}</p>` : ''}
                ${record.note ? `<p><strong>备注：</strong>${record.note}</p>` : ''}
                <p><strong>操作员：</strong>${record.operator}</p>
            </div>
        </div>
    `).join('');
}

// 更新物品选择下拉框
function updateItemSelects() {
    const inboundSelect = document.getElementById('inboundItem');
    const outboundSelect = document.getElementById('outboundItem');
    
    const options = inventory.map(item => 
        `<option value="${item.id}">${item.name} (${item.category})</option>`
    ).join('');
    
    inboundSelect.innerHTML = '<option value="">请选择物品</option>' + options;
    outboundSelect.innerHTML = '<option value="">请选择物品</option>' + options;
}

// 快速入库
function quickInbound(itemId) {
    const quantity = prompt('请输入入库数量：');
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const item = inventory.find(item => item.id === itemId);
        if (item) {
            item.quantity += parseInt(quantity);
            
            const record = {
                id: Date.now().toString(),
                type: '入库',
                itemId: itemId,
                itemName: item.name,
                quantity: parseInt(quantity),
                reason: '快速入库',
                note: '',
                timestamp: new Date().toISOString(),
                operator: '系统管理员'
            };
            
            records.unshift(record);
            saveData();
            renderInventory();
            renderRecords();
            showMessage(`${item.name} 快速入库成功！`, 'success');
        }
    }
}

// 快速出库
function quickOutbound(itemId) {
    const item = inventory.find(item => item.id === itemId);
    if (!item) return;
    
    if (item.quantity === 0) {
        showMessage('该物品库存为0，无法出库！', 'error');
        return;
    }
    
    const quantity = prompt(`请输入出库数量（当前库存：${item.quantity}${item.unit}）：`);
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        if (parseInt(quantity) > item.quantity) {
            showMessage('出库数量不能超过库存数量！', 'error');
            return;
        }
        
        item.quantity -= parseInt(quantity);
        
        const record = {
            id: Date.now().toString(),
            type: '出库',
            itemId: itemId,
            itemName: item.name,
            quantity: parseInt(quantity),
            className: '快速出库',
            teacher: '系统管理员',
            note: '',
            timestamp: new Date().toISOString(),
            operator: '系统管理员'
        };
        
        records.unshift(record);
        saveData();
        renderInventory();
        renderRecords();
        showMessage(`${item.name} 快速出库成功！`, 'success');
    }
}

// 删除物品
function deleteItem(itemId) {
    if (confirm('确定要删除这个物品吗？此操作不可恢复！')) {
        inventory = inventory.filter(item => item.id !== itemId);
        saveData();
        renderInventory();
        updateItemSelects();
        showMessage('物品删除成功！', 'success');
    }
}

// 模态框控制
function showAddItemModal() {
    document.getElementById('addItemModal').style.display = 'block';
}

function closeAddItemModal() {
    document.getElementById('addItemModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('addItemModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// 显示消息
function showMessage(message, type) {
    // 移除现有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 插入到主要内容区域顶部
    const main = document.querySelector('main');
    main.insertBefore(messageDiv, main.firstChild);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 格式化日期时间
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('kindergarten_inventory', JSON.stringify(inventory));
    localStorage.setItem('kindergarten_records', JSON.stringify(records));
}

// 添加示例数据
function addSampleData() {
    const sampleItems = [
        {
            id: '001',
            name: '积木玩具',
            category: '玩具',
            unit: '套',
            description: '彩色积木，适合3-6岁儿童',
            quantity: 15,
            createdAt: new Date().toISOString()
        },
        {
            id: '002',
            name: '彩色铅笔',
            category: '文具',
            unit: '盒',
            description: '12色彩色铅笔',
            quantity: 8,
            createdAt: new Date().toISOString()
        },
        {
            id: '003',
            name: '拼图玩具',
            category: '教具',
            unit: '套',
            description: '100片拼图，锻炼思维能力',
            quantity: 3,
            createdAt: new Date().toISOString()
        },
        {
            id: '004',
            name: '湿纸巾',
            category: '清洁用品',
            unit: '包',
            description: '婴儿专用湿纸巾',
            quantity: 25,
            createdAt: new Date().toISOString()
        }
    ];
    
    inventory = sampleItems;
    saveData();
    renderInventory();
    updateItemSelects();
}