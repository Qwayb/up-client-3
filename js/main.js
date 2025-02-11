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
        moveTaskToNextColumn() {
            const nextColumnIndex = this.columnIndex + 1;
            if (nextColumnIndex < this.columns.length) {
                this.moveTask(this.task, nextColumnIndex);
            }
        },
        moveTaskToPreviousColumn() {
            if (this.columnIndex > 0) {
                this.moveTaskBack(this.task, this.columnIndex - 1);
            }
        },
        deleteTask() {
            this.removeTask(this.task, this.columnIndex);
        }
    },
    template: `
    <div class="task-card" :class="taskClass">
      <div v-if="!isEditing">
        <p><strong>{{ task.title }}</strong></p>
        <p>{{ task.description }}</p>
        <p v-if="task.explanation">Return Reason: {{ task.explanation }}</p>
        <p>Deadline: {{ task.deadline }}</p>
        <p>Last Edited: {{ task.lastEdited }}</p>
        <button v-if="columnIndex !== 3" @click="editTask">Edit</button>
        <button v-if="columnIndex !== 3" @click="moveTaskToNextColumn">Move to Next Column</button>
        <button v-if="columnIndex === 0" @click="deleteTask">Delete</button>
        <button v-if="columnIndex === 2" @click="moveTaskToPreviousColumn">Move to Previous Column</button>
      </div>
      <div v-else>
        <input v-model="editedTitle" placeholder="Title" />
        <textarea v-model="editedDescription" placeholder="Description"></textarea>
        <input type="date" v-model="editedDeadline" />
        <button @click="saveTask">Save</button>
      </div>
    </div>
  `
});

// Компонент столбца
Vue.component('column', {
    props: ['columnTitle', 'tasks', 'columnIndex', 'moveTask', 'moveTaskBack', 'removeTask', 'isButton', 'columns'],
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
                this.showModal = true;
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
            } else {
                alert('Please fill in the title and deadline.');
            }
        },
        clearForm() {
            this.newTaskTitle = '';
            this.newTaskDescription = '';
            this.newTaskDeadline = '';
        }
    },
    template: `
    <div class="column">
      <h2>{{ columnTitle }}</h2>
      <div v-if="isButton">
        <button @click="addTask">Add Task</button>
      </div>
      <div v-for="(task, index) in tasks" :key="index">
        <task-card 
          :task="task" 
          :columnIndex="columnIndex" 
          :moveTask="moveTask" 
          :moveTaskBack="moveTaskBack"
          :removeTask="removeTask" 
          :columns="columns"
        />
      </div>

      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h3>Create New Task</h3>
          <input v-model="newTaskTitle" placeholder="Title" />
          <textarea v-model="newTaskDescription" placeholder="Description"></textarea>
          <input type="date" v-model="newTaskDeadline" />
          <button @click="saveNewTask">Save</button>
          <button @click="showModal = false">Cancel</button>
        </div>
      </div>
    </div>
  `
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
            ]
        };
    },
    methods: {
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
        },
        moveTaskBack(task, prevColumnIndex) {
            let explanation = prompt('Enter the reason for returning the task:');
            if (explanation) {
                task.explanation = explanation;
            }
            const currentColumn = this.columns.find(column => column.tasks.includes(task));
            if (currentColumn) {
                currentColumn.tasks = currentColumn.tasks.filter(t => t !== task);
            }
            if (prevColumnIndex >= 0) {
                this.columns[prevColumnIndex].tasks.push(task);
            }
        },
        removeTask(task, columnIndex) {
            this.columns[columnIndex].tasks = this.columns[columnIndex].tasks.filter(t => t !== task);
        },
        onTaskCompleted(task) {
            task.isCompleted = true;
            const deadlineDate = new Date(task.deadline);
            const now = new Date();
            task.completedOnTime = now <= deadlineDate;
        }
    },
    template: `
    <div>
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
        />
      </div>
    </div>
  `
});