Vue.component('add_task', {
    template: `
    <div class="column">
        <h2>Добавить задачу</h2>
        <div>
            <label>Название задачи <input maxlength="35" minlength="3" v-model="task.name"></label>
            <h3>Подзадачи</h3>
            <div v-for="(subtask, index) in task.subtasks" :key="index">
                <input placeholder="Напиши подзадачу" maxlength="50" minlength="3" v-model="subtask.name">
                <button @click="delSubtask(index)">-</button>
            </div>
            <button @click="addSubtask" :disabled="task.subtasks.length >= maxSubtasks">+</button>
            <label>Приоритет: 
                <select v-model="task.priority">
                    <option v-for="n in 5" :value="n">{{ n }}</option>
                </select>
            </label>
            <button @click="addTask" >Добавить</button>
        </div>
    </div>
    `,
    data() {
        return {
            task: {
                name: 'Новая задача',
                subtasks: [],
                priority: 1
            },
            maxSubtasks: 5,
            maxTasks: [3, 5]
        }
    },
    methods: {
        addSubtask() {
            if (this.task.subtasks.length < this.maxSubtasks) {
                this.task.subtasks.push({ name: "", done: false });
            } else {
                alert("Максимальное количество подзадач для этого столбца: " + this.maxSubtasks);
            }
        },
        delSubtask(index) {
            this.task.subtasks.splice(index, 1);
        },
        addTask() {
            const columnIndex = this.$parent.columns.findIndex(column => column.name === 'Новые задачи');
            const maxTasks = this.$parent.columns[columnIndex].tasks.length >= this.maxTasks[columnIndex];

            if (!maxTasks) {
                if (!this.task.name) {
                    alert('Необходимо заполнить заголовок задачи.');
                    return;
                }

                this.task.subtasks = this.task.subtasks.filter(subtask => subtask.name.trim() !== '');

                if (this.task.subtasks.length < 3 || this.task.subtasks.length > this.maxSubtasks) {
                    alert(`Задача должна содержать от 3 до ${this.maxSubtasks} подзадач.`);
                    return;
                }

                if (this.task.subtasks.length === 0 || !this.task.subtasks.every(subtask => subtask.name)) {
                    alert('Все задачи должны иметь хотя бы одну подзадачу и название.');
                    return;
                }

                let newTask = {
                    name: this.task.name,
                    subtasks: this.task.subtasks.map(subtask => ({ name: subtask.name, done: false })),
                    priority: this.task.priority
                };
                this.$emit('add-task', newTask);

                this.task.name = 'Новая задача';
                this.task.subtasks = [];
                this.task.priority = 1;
            } else {
                alert("Вы достигли максимального количества задач в этом столбце!");
            }
        }
    }
});

Vue.component('column', {
    props: ['column', 'isFirstColumnDisabled'],
    template: `
    <div class="column" :class="{ 'pointer-events-none': isFirstColumnDisabled }">
        <h2>{{ column.name }}</h2>
        <div class="task">
            <task v-for="(task, index) in sortedTasks" :key="index" :task="task" @done-subtask="doneSubtask(task, $event)" @change-priority="changePriority(task, $event)"></task>
        </div>
    </div>
    `,
    computed: {
        sortedTasks() {
            return this.column.tasks.slice().sort((a, b) => b.priority - a.priority);
        }
    },
    methods: {
        doneSubtask(task, subtask) {
            const taskIndex = this.column.tasks.indexOf(task);
            const subtaskIndex = task.subtasks.indexOf(subtask);
            this.column.tasks[taskIndex].subtasks[subtaskIndex].done = subtask.done;

            if (this.column.name === 'В процессе' && this.column.tasks[taskIndex].subtasks.every(subtask => subtask.done)) {
                this.column.tasks = this.column.tasks.filter(t => t !== task);
                this.$emit('move-task', task, 2);
            } else if (this.column.name !== 'В процессе' && this.column.tasks[taskIndex].subtasks.filter(subtask => subtask.done).length >= this.column.tasks[taskIndex].subtasks.length / 2) {
                const columnIndex = this.$parent.columns.findIndex(column => column.name === 'В процессе');
                this.column.tasks = this.column.tasks.filter(t => t !== task);
                this.$emit('move-task', task, 1);
                this.$emit('disable-first-column', true);
            }
        },
        changePriority(task, change) {
            const index = this.column.tasks.indexOf(task);
            if (index > -1) {
                this.column.tasks[index].priority += change;
                if (this.column.tasks[index].priority < 1) {
                    this.column.tasks[index].priority = 1;
                } else if (this.column.tasks[index].priority > 5) {
                    this.column.tasks[index].priority = 5;
                }
                this.column.tasks.sort((a, b) => b.priority - a.priority);
            }
        }
    }
});

Vue.component('task', {
    props: ['task', 'isDisabled', 'columnIndex', 'taskIndex'],
    template: `
    <div>
        <div>
            <h2>{{ task.name }} (Приоритет: {{ task.priority }})</h2>
            <p v-if="task.completedAt">Завершено: {{ task.completedAt }}</p>
            <div v-for="subtask in task.subtasks" class="subtask" :class="{ done: subtask.done, disabled_poisk: isDisabled }" @click="isDisabled || toggleSubtask(subtask)">
                <input maxlength="45" minlength="3" type="checkbox" v-model="subtask.done" :disabled="isDisabled"> {{ subtask.name }}
            </div>
            <div v-if="!isDisabled">
                <button @click="changePriority(1)" :disabled="task.priority >= 5">↑</button>
                <button @click="changePriority(-1)" :disabled="task.priority <= 1">↓</button>
            </div>
        </div>
    </div>
    `,
    methods: {
        toggleSubtask(subtask) {
            subtask.done = !subtask.done;
            this.$emit('done-subtask', subtask);
        },
        changePriority(change) {
            this.$emit('change-priority', change);
        }
    }
});

// Vue.component('search-container', {
//     template: `
//         <div class="search-container">
//             <input type="text" v-model="searchQuery" placeholder="Поиск...">
//         </div>
//     `,
//     props: ['searchQuery']
// });

Vue.component('search_results', {
    template: `
        <div class="search-results">
            <h2>Результаты поиска:</h2>
            <div v-if="filteredTasks.length === 0">Нет результатов</div>
            <div v-else>
                <task v-for="(task, index) in filteredTasks" :key="index" :task="task" :is-disabled="true"></task>
            </div>
        </div>
    `,
    props: ['filteredTasks']
});


let app = new Vue({
    el: '#app',
    data: {
        name: "Vue To Do list",
        columns: [
            {
                disabled: false,
                name: "Новые задачи",
                tasks: []
            },
            {
                name: "В процессе",
                tasks: []
            },
            {
                name: "Закончено",
                tasks: []
            }
        ],
        isFirstColumnDisabled: false,
        searchQuery: ''
    },
    computed: {
        filteredTasks() {
            return this.columns.flatMap(column => column.tasks.filter(task =>
                task.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            ));
        }
    },
    mounted() {
        if (localStorage.columns) {
            this.columns = JSON.parse(localStorage.columns);
        }
    },
    watch: {
        columns: {
            handler: function (val) {
                localStorage.columns = JSON.stringify(val);
                this.checkSecondColumnLimit();
            },
            deep: true
        }
    },
    methods: {
        saveData() {
            localStorage.setItem('columns', JSON.stringify(this.columns))
        },
        addTask(task) {
            const columnIndex = this.columns.findIndex(column => column.name === 'Новые задачи');
            const maxTasks = this.columns[columnIndex].tasks.length >= [3, 5][columnIndex];

            if (!maxTasks) {
                this.columns[columnIndex].tasks.push(task);
                this.saveData();
            } else {
                alert("Вы достигли максимального количества задач в этом столбце!");
            }
        },
        moveTask(task, columnIndex) {
            this.columns[0].disabled = false;

            task.completedAt = new Date().toLocaleString();

            this.columns[columnIndex - 1].tasks = this.columns[columnIndex - 1].tasks.filter(t => t !== task);
            this.columns[columnIndex].tasks.push(task);
            this.saveData();
            this.checkSecondColumnLimit();
        },
        checkSecondColumnLimit() {
            if (this.columns[1].tasks.length > 4) {
                this.columns[0].disabled = true
                alert("это будет ваша последняя задача, пока не сделаешь все, знай! Ps делай задачи из колонки в процессе")
                return;
            }
            this.moveTask(this.columns[1])

        },
        disableFirstColumn(isDisabled) {
            this.isFirstColumnDisabled = isDisabled;
        }
    }
});