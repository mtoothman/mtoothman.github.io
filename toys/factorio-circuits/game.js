class FactorioCircuitTutorial {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.selectedComponent = null;
        this.placingWire = false;
        this.wireStart = null;
        this.components = [];
        this.wires = [];
        this.signals = new Map();
        this.gridSize = 40;
        this.mousePos = { x: 0, y: 0 };
        
        this.levels = [
            {
                title: "Level 1: Basic Connection",
                instructions: "Connect the constant combinator to the lamp using red wire. The lamp should light up when receiving a signal.",
                hint: "Click on the red wire in the component panel, then click on the constant combinator and drag to the lamp.",
                components: [
                    { type: 'constant-combinator', x: 2, y: 2 },
                    { type: 'lamp', x: 6, y: 2 }
                ],
                goal: { type: 'lamp-lit', target: { x: 6, y: 2 } }
            },
            {
                title: "Level 2: Arithmetic Operations",
                instructions: "Use an arithmetic combinator to multiply the iron signal by 2, then light the lamp.",
                hint: "Place an arithmetic combinator between the constant combinator and lamp. Set it to: Iron * 2 → Iron",
                components: [
                    { type: 'constant-combinator', x: 1, y: 3 },
                    { type: 'lamp', x: 7, y: 3 }
                ],
                goal: { type: 'signal-value', signal: 'iron', value: 10, at: { x: 7, y: 3 } }
            },
            {
                title: "Level 3: Decision Making",
                instructions: "Use a decider combinator to only light the lamp when iron ≥ 10.",
                hint: "Set the decider combinator condition: Iron ≥ 10, output: Signal → 1",
                components: [
                    { type: 'constant-combinator', x: 1, y: 2 },
                    { type: 'lamp', x: 7, y: 2 }
                ],
                goal: { type: 'conditional-lamp', condition: 'iron >= 10' }
            },
            {
                title: "Level 4: Multiple Networks",
                instructions: "Create two separate networks using red and green wires.",
                hint: "Use red wire for one network and green wire for another. Signals don't mix between wire colors.",
                components: [
                    { type: 'constant-combinator', x: 1, y: 1 },
                    { type: 'constant-combinator', x: 1, y: 4 },
                    { type: 'lamp', x: 6, y: 1 },
                    { type: 'lamp', x: 6, y: 4 }
                ],
                goal: { type: 'separate-networks', networks: 2 }
            },
            {
                title: "Level 5: Complex Logic",
                instructions: "Build a circuit that lights the lamp only when iron + copper > 15.",
                hint: "Use arithmetic combinator to add signals, then decider to check the condition.",
                components: [
                    { type: 'constant-combinator', x: 1, y: 2 },
                    { type: 'lamp', x: 8, y: 3 }
                ],
                goal: { type: 'complex-condition', condition: 'iron + copper > 15' }
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLevel(1);
        this.gameLoop();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        document.querySelectorAll('.component-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.classList.contains('info-toggle')) {
                    this.selectComponent(e.target.closest('.component-item'));
                }
            });
        });
        
        document.querySelectorAll('.info-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleComponentInfo(e.target);
            });
        });
        
        document.getElementById('prev-level').addEventListener('click', () => this.prevLevel());
        document.getElementById('reset-level').addEventListener('click', () => this.resetLevel());
        document.getElementById('hint-btn').addEventListener('click', () => this.toggleHint());
        document.getElementById('level-select').addEventListener('change', (e) => this.jumpToLevel(parseInt(e.target.value)));
        
        // Modal event listeners
        document.querySelector('.modal-close').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('config-cancel').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('config-save').addEventListener('click', () => this.saveComponentConfig());
        document.getElementById('config-modal').addEventListener('click', (e) => {
            if (e.target.id === 'config-modal') {
                this.closeConfigModal();
            }
        });
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize);
        const y = Math.floor((e.clientY - rect.top) / this.gridSize);
        
        if (this.selectedComponent === 'red-wire' || this.selectedComponent === 'green-wire') {
            this.handleWirePlacement(x, y);
        } else if (this.selectedComponent && this.selectedComponent !== 'red-wire' && this.selectedComponent !== 'green-wire') {
            this.placeComponent(x, y);
        } else {
            this.selectComponentAt(x, y);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }
    
    handleWirePlacement(x, y) {
        const component = this.getComponentAt(x, y);
        if (!component) return;
        
        if (!this.placingWire) {
            this.wireStart = { x, y, component };
            this.placingWire = true;
        } else {
            if (this.wireStart.x !== x || this.wireStart.y !== y) {
                this.addWire(this.wireStart, { x, y, component }, this.selectedComponent);
                this.placingWire = false;
                this.wireStart = null;
                this.updateSignals();
                this.checkLevelComplete();
            }
        }
    }
    
    placeComponent(x, y) {
        if (this.getComponentAt(x, y)) return;
        
        const component = {
            type: this.selectedComponent,
            x: x,
            y: y,
            id: Date.now(),
            signals: {},
            config: this.getDefaultConfig(this.selectedComponent)
        };
        
        this.components.push(component);
        this.selectedComponent = null;
        this.updateComponentSelection();
    }
    
    selectComponent(element) {
        document.querySelectorAll('.component-item').forEach(item => item.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedComponent = element.dataset.component;
        this.placingWire = false;
        this.wireStart = null;
    }
    
    selectComponentAt(x, y) {
        const component = this.getComponentAt(x, y);
        if (component && (component.type.includes('combinator'))) {
            this.showComponentConfig(component);
        }
    }
    
    showComponentConfig(component) {
        this.configComponent = component;
        const modal = document.getElementById('config-modal');
        const title = document.getElementById('modal-title');
        
        // Hide all config panels
        document.querySelectorAll('.config-panel').forEach(panel => panel.classList.add('hidden'));
        
        if (component.type === 'arithmetic-combinator') {
            title.textContent = 'Configure Arithmetic Combinator';
            document.getElementById('arithmetic-config').classList.remove('hidden');
            
            // Load current values
            document.getElementById('arith-input1').value = component.config.input1 || 'iron';
            document.getElementById('arith-operation').value = component.config.operation || 'multiply';
            document.getElementById('arith-input2').value = component.config.input2 || '1';
            document.getElementById('arith-output').value = component.config.output || 'iron';
        } else if (component.type === 'decider-combinator') {
            title.textContent = 'Configure Decider Combinator';
            document.getElementById('decider-config').classList.remove('hidden');
            
            // Load current values
            document.getElementById('decider-condition').value = component.config.condition || 'iron';
            document.getElementById('decider-operator').value = component.config.operator || '>';
            document.getElementById('decider-value').value = component.config.value || '0';
            document.getElementById('decider-output-signal').value = component.config.output || 'signal';
            document.getElementById('decider-output-value').value = component.config.outputValue || '1';
        } else if (component.type === 'constant-combinator') {
            title.textContent = 'Configure Constant Combinator';
            document.getElementById('constant-config').classList.remove('hidden');
            
            // Load current values
            const signals = component.config.signals || { iron: 1, copper: 0, coal: 0, wood: 0 };
            document.getElementById('constant-iron').value = signals.iron || 0;
            document.getElementById('constant-copper').value = signals.copper || 0;
            document.getElementById('constant-coal').value = signals.coal || 0;
            document.getElementById('constant-wood').value = signals.wood || 0;
        }
        
        modal.classList.remove('hidden');
    }
    
    closeConfigModal() {
        document.getElementById('config-modal').classList.add('hidden');
        this.configComponent = null;
    }
    
    saveComponentConfig() {
        if (!this.configComponent) return;
        
        const component = this.configComponent;
        
        if (component.type === 'arithmetic-combinator') {
            component.config = {
                input1: document.getElementById('arith-input1').value,
                operation: document.getElementById('arith-operation').value,
                input2: document.getElementById('arith-input2').value,
                output: document.getElementById('arith-output').value
            };
        } else if (component.type === 'decider-combinator') {
            component.config = {
                condition: document.getElementById('decider-condition').value,
                operator: document.getElementById('decider-operator').value,
                value: document.getElementById('decider-value').value,
                output: document.getElementById('decider-output-signal').value,
                outputValue: document.getElementById('decider-output-value').value
            };
        } else if (component.type === 'constant-combinator') {
            component.config = {
                signals: {
                    iron: parseInt(document.getElementById('constant-iron').value) || 0,
                    copper: parseInt(document.getElementById('constant-copper').value) || 0,
                    coal: parseInt(document.getElementById('constant-coal').value) || 0,
                    wood: parseInt(document.getElementById('constant-wood').value) || 0
                }
            };
        }
        
        this.updateSignals();
        this.checkLevelComplete();
        this.closeConfigModal();
    }
    
    getComponentAt(x, y) {
        return this.components.find(comp => comp.x === x && comp.y === y);
    }
    
    addWire(start, end, wireType) {
        const wire = {
            start: start,
            end: end,
            type: wireType,
            id: Date.now()
        };
        this.wires.push(wire);
    }
    
    getDefaultConfig(type) {
        switch(type) {
            case 'constant-combinator':
                return { signals: { iron: 1 } };
            case 'arithmetic-combinator':
                return { operation: 'add', input1: 'iron', input2: '1', output: 'iron' };
            case 'decider-combinator':
                return { condition: 'iron', operator: '>', value: '0', output: 'signal', outputValue: '1' };
            default:
                return {};
        }
    }
    
    updateSignals() {
        this.signals.clear();
        
        const networks = this.getNetworks();
        
        networks.forEach(network => {
            const networkSignals = new Map();
            
            network.forEach(component => {
                if (component.type === 'constant-combinator') {
                    Object.entries(component.config.signals || {}).forEach(([signal, value]) => {
                        if (value !== 0) {
                            networkSignals.set(signal, (networkSignals.get(signal) || 0) + value);
                        }
                    });
                }
            });
            
            network.forEach(component => {
                if (component.type === 'arithmetic-combinator') {
                    const input1 = networkSignals.get(component.config.input1) || 0;
                    const input2 = isNaN(component.config.input2) ? 
                        (networkSignals.get(component.config.input2) || 0) : 
                        parseInt(component.config.input2);
                    
                    let result = 0;
                    switch(component.config.operation) {
                        case 'add': result = input1 + input2; break;
                        case 'subtract': result = input1 - input2; break;
                        case 'multiply': result = input1 * input2; break;
                        case 'divide': result = input2 !== 0 ? Math.floor(input1 / input2) : 0; break;
                    }
                    
                    networkSignals.set(component.config.output, result);
                }
                
                if (component.type === 'decider-combinator') {
                    const inputValue = networkSignals.get(component.config.condition) || 0;
                    const compareValue = isNaN(component.config.value) ? 
                        (networkSignals.get(component.config.value) || 0) : 
                        parseInt(component.config.value);
                    
                    let condition = false;
                    switch(component.config.operator) {
                        case '>': condition = inputValue > compareValue; break;
                        case '<': condition = inputValue < compareValue; break;
                        case '>=': condition = inputValue >= compareValue; break;
                        case '<=': condition = inputValue <= compareValue; break;
                        case '=': condition = inputValue === compareValue; break;
                    }
                    
                    if (condition) {
                        const outputValue = component.config.outputValue === 'input' ? 
                            inputValue : parseInt(component.config.outputValue);
                        networkSignals.set(component.config.output, outputValue);
                    }
                }
            });
            
            network.forEach(component => {
                component.networkSignals = new Map(networkSignals);
            });
        });
        
        this.updateSignalDisplay();
    }
    
    getNetworks() {
        const networks = [];
        const visited = new Set();
        
        this.components.forEach(component => {
            if (visited.has(component.id)) return;
            
            const network = [];
            const queue = [component];
            
            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current.id)) continue;
                
                visited.add(current.id);
                network.push(current);
                
                const connectedWires = this.wires.filter(wire => 
                    (wire.start.component.id === current.id || wire.end.component.id === current.id)
                );
                
                connectedWires.forEach(wire => {
                    const other = wire.start.component.id === current.id ? 
                        wire.end.component : wire.start.component;
                    if (!visited.has(other.id)) {
                        queue.push(other);
                    }
                });
            }
            
            if (network.length > 0) {
                networks.push(network);
            }
        });
        
        return networks;
    }
    
    loadLevel(levelNum) {
        this.currentLevel = levelNum;
        const level = this.levels[levelNum - 1];
        
        this.components = level.components.map(comp => ({
            ...comp,
            id: Date.now() + Math.random(),
            config: this.getDefaultConfig(comp.type),
            networkSignals: new Map()
        }));
        
        this.wires = [];
        this.selectedComponent = null;
        this.placingWire = false;
        
        document.getElementById('level-title').textContent = level.title;
        document.getElementById('level-instructions').textContent = level.instructions;
        document.getElementById('current-level').textContent = levelNum;
        document.getElementById('total-levels').textContent = this.levels.length;
        document.getElementById('progress-fill').style.width = `${(levelNum / this.levels.length) * 100}%`;
        
        document.getElementById('prev-level').disabled = levelNum <= 1;
        document.getElementById('level-select').value = levelNum;
        
        this.updateComponentSelection();
        this.updateSignals();
    }
    
    checkLevelComplete() {
        const level = this.levels[this.currentLevel - 1];
        const goal = level.goal;
        
        let completed = false;
        
        switch(goal.type) {
            case 'lamp-lit':
                const lamp = this.getComponentAt(goal.target.x, goal.target.y);
                completed = lamp && lamp.networkSignals && lamp.networkSignals.size > 0;
                break;
            case 'signal-value':
                const targetComp = this.getComponentAt(goal.at.x, goal.at.y);
                completed = targetComp && targetComp.networkSignals && 
                           targetComp.networkSignals.get(goal.signal) === goal.value;
                break;
        }
        
        if (completed) {
            this.showSuccess();
        }
    }
    
    showSuccess() {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Level Complete!';
        successMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-size: 24px;
            z-index: 1000;
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            document.body.removeChild(successMsg);
        }, 2000);
    }
    
    prevLevel() {
        if (this.currentLevel > 1) {
            this.loadLevel(this.currentLevel - 1);
        }
    }
    
    resetLevel() {
        this.loadLevel(this.currentLevel);
    }
    
    jumpToLevel(levelNum) {
        if (levelNum >= 1 && levelNum <= this.levels.length) {
            this.loadLevel(levelNum);
        }
    }
    
    toggleHint() {
        const hintPanel = document.getElementById('hint-panel');
        const hintText = document.getElementById('hint-text');
        const level = this.levels[this.currentLevel - 1];
        
        if (hintPanel.classList.contains('hidden')) {
            hintText.textContent = level.hint;
            hintPanel.classList.remove('hidden');
        } else {
            hintPanel.classList.add('hidden');
        }
    }
    
    toggleComponentInfo(toggle) {
        const targetId = toggle.dataset.target;
        const description = document.getElementById(targetId);
        
        if (description.classList.contains('hidden')) {
            description.classList.remove('hidden');
            toggle.style.transform = 'rotate(180deg)';
        } else {
            description.classList.add('hidden');
            toggle.style.transform = 'rotate(0deg)';
        }
    }
    
    updateComponentSelection() {
        document.querySelectorAll('.component-item').forEach(item => {
            if (item.dataset.component === this.selectedComponent) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    updateSignalDisplay() {
        const signalsList = document.getElementById('signals-list');
        signalsList.innerHTML = '';
        
        const allSignals = new Map();
        this.components.forEach(component => {
            if (component.networkSignals) {
                component.networkSignals.forEach((value, signal) => {
                    if (value !== 0) {
                        allSignals.set(signal, value);
                    }
                });
            }
        });
        
        allSignals.forEach((value, signal) => {
            const signalItem = document.createElement('div');
            signalItem.className = 'signal-item';
            signalItem.textContent = `${signal}: ${value}`;
            signalsList.appendChild(signalItem);
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawWires();
        this.drawComponents();
        this.drawWirePreview();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawComponents() {
        this.components.forEach(component => {
            const x = component.x * this.gridSize + this.gridSize / 2;
            const y = component.y * this.gridSize + this.gridSize / 2;
            
            this.ctx.fillStyle = this.getComponentColor(component);
            this.ctx.fillRect(
                component.x * this.gridSize + 4,
                component.y * this.gridSize + 4,
                this.gridSize - 8,
                this.gridSize - 8
            );
            
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                component.x * this.gridSize + 4,
                component.y * this.gridSize + 4,
                this.gridSize - 8,
                this.gridSize - 8
            );
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.getComponentSymbol(component),
                x,
                y + 4
            );
            
            if (component.type === 'lamp' && component.networkSignals && component.networkSignals.size > 0) {
                this.ctx.fillStyle = 'yellow';
                this.ctx.beginPath();
                this.ctx.arc(x, y - 12, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawWires() {
        this.wires.forEach(wire => {
            const startX = wire.start.x * this.gridSize + this.gridSize / 2;
            const startY = wire.start.y * this.gridSize + this.gridSize / 2;
            const endX = wire.end.x * this.gridSize + this.gridSize / 2;
            const endY = wire.end.y * this.gridSize + this.gridSize / 2;
            
            this.ctx.strokeStyle = wire.type === 'red-wire' ? '#d0021b' : '#50e3c2';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        });
    }
    
    drawWirePreview() {
        if (this.placingWire && this.wireStart) {
            const startX = this.wireStart.x * this.gridSize + this.gridSize / 2;
            const startY = this.wireStart.y * this.gridSize + this.gridSize / 2;
            
            this.ctx.strokeStyle = this.selectedComponent === 'red-wire' ? '#d0021b' : '#50e3c2';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    getComponentColor(component) {
        switch(component.type) {
            case 'constant-combinator': return '#4a90e2';
            case 'arithmetic-combinator': return '#7ed321';
            case 'decider-combinator': return '#f5a623';
            case 'lamp': return '#f8e71c';
            default: return '#666';
        }
    }
    
    getComponentSymbol(component) {
        switch(component.type) {
            case 'constant-combinator': return 'C';
            case 'arithmetic-combinator': return '+';
            case 'decider-combinator': return '?';
            case 'lamp': return '💡';
            default: return '?';
        }
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FactorioCircuitTutorial();
});