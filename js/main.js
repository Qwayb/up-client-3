Vue.component('task-card', {
    props: ['task', 'columnIndex', 'moveTask', 'removeTask', 'moveTaskBack', 'columns'],
    data() {
        return {
            isEditing: false,
            editedTitle: this.task.title,
            editedDescription: this.task.description,
            editedDeadline: this.task.deadline
        };
    },
    computed: {
        taskClass() {
            if (this.task.isCompleted) {
                return this.task.completedOnTime ? 'completed-on-time' : 'completed-late';
            }
            return '';
        }
    },
    methods: {
        editTask() {
            this.isEditing = true;
        },
        saveTask() {
            this.task.title = this.editedTitle;
            this.task.description = this.editedDescription;
            this.task.deadline = this.editedDeadline;
            this.task.lastEdited = new Date().toLocaleString();
            this.isEditing = false;
        },
        deleteTask() {
            this.removeTask(this.task, this.columnIndex);
        },
        onDragStart(event) {
            event.dataTransfer.setData('text/plain', JSON.stringify({
                task: this.task,
                fromColumnIndex: this.columnIndex
            }));
        }
    },
    template: 
    `<div 
        class="task-card" 
        :class="taskClass"
        draggable="true"
        @dragstart="onDragStart"
    >
      <div v-if="!isEditing">
        <p><strong>{{ task.title }}</strong></p>
        <p>{{ task.description }}</p>
        <p v-if="task.explanation">Return Reason: {{ task.explanation }}</p>
        <p>Deadline: {{ task.deadline }}</p>
        <p>Last Edited: {{ task.lastEdited }}</p>
        <p v-if="columnIndex === 3">
          <strong v-if="task.completedOnTime">Completed on time</strong>
          <strong v-else>Completed late</strong>
        </p>
        <button v-if="columnIndex !== 3" @click="editTask">Edit</button>
        <button v-if="columnIndex === 0" @click="deleteTask">Delete</button>
      </div>
      <div v-else>
        <input v-model="editedTitle" placeholder="Title" />
        <textarea v-model="editedDescription" placeholder="Description"></textarea>
        <input type="date" v-model="editedDeadline" />
        <button @click="saveTask">Save</button>
      </div>
    </div>`
});

Vue.component('column', {
    props: ['columnTitle', 'tasks', 'columnIndex', 'moveTask', 'moveTaskBack', 'removeTask', 'isButton', 'columns', 'searchQuery'],
    data() {
        return {
            showModal: false,
            newTaskTitle: '',
            newTaskDescription: '',
            newTaskDeadline: ''
        };
    },
    methods: {
        addTask() {
            if (this.columnIndex === 0) {
                this.$emit('open-modal'); // Передаем событие в корневой компонент
            }
        },
        saveNewTask() {
            if (this.newTaskTitle && this.newTaskDeadline) {
                const newTask = {
                    title: this.newTaskTitle,
                    description: this.newTaskDescription,
                    deadline: this.newTaskDeadline,
                    lastEdited: new Date().toLocaleString(),
                    isCompleted: false,
                    completedOnTime: false
                };
                this.tasks.push(newTask);
                this.showModal = false;
                this.clearForm();
                this.$emit('save-tasks');
            } else {
                alert('Please fill in the title and deadline.');
            }
        },
        clearForm() {
            this.newTaskTitle = '';
            this.newTaskDescription = '';
            this.newTaskDeadline = '';
        },
        filterTasks(tasks) {
            return tasks.filter(task => task.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        },
        onDragOver(event) {
            event.preventDefault();
        },
        onDrop(event) {
            event.preventDefault();
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            const task = data.task;
            const fromColumnIndex = data.fromColumnIndex;
            const toColumnIndex = this.columnIndex;

            if (toColumnIndex === 1 && fromColumnIndex === 2) {
                const explanation = prompt('Enter the reason for returning the task:');
                if (!explanation) {
                    alert('Return reason is required!');
                    return;
                }
                task.explanation = explanation;
            }

            if (fromColumnIndex === 3) {
                alert('You cant move from 3rd column!');
                return;
            }

            // Удаляем задачу из исходного столбца
            const fromColumn = this.$parent.columns[fromColumnIndex];
            const taskIndex = fromColumn.tasks.findIndex(t => t === task);
            fromColumn.tasks.splice(taskIndex, 1); // Удаляем задачу из исходного столбца

            this.tasks.push(task);

            if (toColumnIndex === 3) {
                this.$parent.onTaskCompleted(task);
            }

            this.$parent.saveTasks();
        }
    },
    template: `
    <div 
        class="column"
        @dragover="onDragOver"
        @drop="onDrop"
    >
        <h2>{{ columnTitle }}</h2>
        <div v-if="isButton">
            <button @click="addTask">Add Task</button>
        </div>
        <div v-for="(task, index) in filterTasks(tasks)" :key="index">
            <task-card 
                :task="task" 
                :columnIndex="columnIndex" 
                :moveTask="moveTask" 
                :moveTaskBack="moveTaskBack"
                :removeTask="removeTask" 
                :columns="columns"
            />
        </div>
    </div>`
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { title: 'Planned Tasks', tasks: [], isButton: true },
                { title: 'Tasks in Progress', tasks: [], isButton: false },
                { title: 'Testing', tasks: [], isButton: false },
                { title: 'Completed Tasks', tasks: [], isButton: false }
            ],
            showModal: false,
            newTaskTitle: '',
            newTaskDescription: '',
            newTaskDeadline: '',
            searchQuery: ''
        };
    },
    created() {
        this.loadTasks();
    },
    methods: {
        saveTasks() {
            localStorage.setItem('kanbanTasks', JSON.stringify(this.columns));
        },
        loadTasks() {
            const savedTasks = localStorage.getItem('kanbanTasks');
            if (savedTasks) {
                this.columns = JSON.parse(savedTasks);
            }
        },
        clearStorage() {
            localStorage.removeItem('kanbanTasks');
            location.reload();
        },
        openModal() {
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.clearForm();
        },
        clearForm() {
            this.newTaskTitle = '';
            this.newTaskDescription = '';
            this.newTaskDeadline = '';
        },
        saveNewTask() {
            if (this.newTaskTitle && this.newTaskDeadline) {
                const newTask = {
                    title: this.newTaskTitle,
                    description: this.newTaskDescription,
                    deadline: this.newTaskDeadline,
                    lastEdited: new Date().toLocaleString(),
                    isCompleted: false,
                    completedOnTime: false
                };
                this.columns[0].tasks.push(newTask);
                this.closeModal();
                this.saveTasks();
            } else {
                alert('Please fill in the title and deadline.');
            }
        },
        moveTask(task, nextColumnIndex) {
            const currentColumn = this.columns.find(column => column.tasks.includes(task));
            if (currentColumn) {
                currentColumn.tasks = currentColumn.tasks.filter(t => t !== task);
            }
            if (nextColumnIndex < this.columns.length) {
                this.columns[nextColumnIndex].tasks.push(task);
            }
            if (nextColumnIndex === 3) {
                this.onTaskCompleted(task);
            }
            this.saveTasks();
        },
        moveTaskBack(task, prevColumnIndex) {
            if (prevColumnIndex === 1) {
                const explanation = prompt('Enter the reason for returning the task:');
                if (!explanation) {
                    alert('Return reason is required!');
                    return;
                }
                task.explanation = explanation;
            }
            const currentColumn = this.columns.find(column => column.tasks.includes(task));
            if (currentColumn) {
                currentColumn.tasks = currentColumn.tasks.filter(t => t !== task);
            }
            if (prevColumnIndex >= 0) {
                this.columns[prevColumnIndex].tasks.push(task);
            }
            this.saveTasks();
        },
        removeTask(task, columnIndex) {
            this.columns[columnIndex].tasks = this.columns[columnIndex].tasks.filter(t => t !== task);
            this.saveTasks();
        },
        onTaskCompleted(task) {
            task.isCompleted = true;
            const deadlineDate = new Date(task.deadline);
            const now = new Date();
            task.completedOnTime = now <= deadlineDate;
            this.saveTasks();
        }
    },
    template: `
    <div>
      <div>
        <input type="text" v-model="searchQuery" placeholder="Search tasks..." />
      </div>
      <div class="board">
        <column
          v-for="(column, index) in columns"
          :key="index"
          :columnTitle="column.title"
          :isButton="column.isButton"
          :tasks="column.tasks"
          :columnIndex="index"
          :columns="columns"
          :moveTask="moveTask"
          :moveTaskBack="moveTaskBack"
          :removeTask="removeTask"
          :searchQuery="searchQuery"
          @open-modal="openModal"
        />
      </div>
      <button class="clear-storage-button" @click="clearStorage">Clear Storage</button>

      <!-- Модальное окно -->
      <div :class="['modal', { active: showModal }]">
        <div class="modal-content">
          <h3>Create New Task</h3>
          <input v-model="newTaskTitle" placeholder="Title" />
          <textarea v-model="newTaskDescription" placeholder="Description"></textarea>
          <input type="date" v-model="newTaskDeadline" />
          <button @click="saveNewTask">Save</button>
          <button @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>`
});
