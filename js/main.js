Vue.component('task-card', {
    props: ['task'],
    template: `
    <div class="task-card">
      <p><strong>{{ task.title }}</strong></p>
      <p>{{ task.description }}</p>
      <p>Deadline: {{ task.deadline }}</p>
      <p>Last Edited: {{ task.lastEdited }}</p>
    </div>
  `
});

Vue.component('column', {
    props: ['columnTitle', 'tasks', 'addTask'],
    methods: {
        addNewTask() {
            this.addTask(this.columnTitle); // Передаем название столбца для добавления задачи
        }
    },
    template: `
    <div class="column">
      <h2>{{ columnTitle }}</h2>
      <div v-if="columnTitle === 'Запланированные задачи'">
        <button @click="addNewTask">Add Task</button>
      </div>
      <div v-for="(task, index) in tasks" :key="index">
        <task-card :task="task"/>
      </div>
    </div>
  `
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', tasks: [] },
                { title: 'Задачи в работе', tasks: [] },
                { title: 'Тестирование', tasks: [] },
                { title: 'Выполненные задачи', tasks: [] }
            ]
        };
    },
    methods: {
        addTask(columnTitle) {
            const newTask = {
                title: 'New Task',
                description: 'Task description...',
                deadline: new Date().toLocaleDateString(),
                lastEdited: new Date().toLocaleString()
            };

            const column = this.columns.find(col => col.title === columnTitle);
            if (column) {
                column.tasks.push(newTask);
            }
            this.saveTasks();
        },
        saveTasks() {
            localStorage.setItem('taskBoardData', JSON.stringify(this.columns));
        },
        loadTasks() {
            const savedData = localStorage.getItem('taskBoardData');
            if (savedData) {
                this.columns = JSON.parse(savedData);
            }
        }
    },
    created() {
        this.loadTasks();
    },
    template: `
    <div>
      <div class="board">
        <column
          v-for="(column, index) in columns"
          :key="index"
          :columnTitle="column.title"
          :tasks="column.tasks"
          :addTask="addTask"
        />
      </div>
    </div>
  `
});
