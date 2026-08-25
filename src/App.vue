<script setup>
import { computed, ref } from 'vue'

const query = ref('')

const employees = ref([
  { id: 'EMP-001', name: 'Ayesha Rahman', role: 'HR Manager', department: 'Human Resources', email: 'ayesha@example.com', status: 'Active', initials: 'AR' },
  { id: 'EMP-002', name: 'Tanvir Hasan', role: 'Frontend Developer', department: 'Engineering', email: 'tanvir@example.com', status: 'Active', initials: 'TH' },
  { id: 'EMP-003', name: 'Nusrat Jahan', role: 'Product Designer', department: 'Design', email: 'nusrat@example.com', status: 'Remote', initials: 'NJ' },
  { id: 'EMP-004', name: 'Sabbir Ahmed', role: 'Accountant', department: 'Finance', email: 'sabbir@example.com', status: 'Active', initials: 'SA' },
])

const filteredEmployees = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return employees.value

  return employees.value.filter((employee) =>
    [employee.name, employee.id, employee.role, employee.department, employee.email]
      .some((value) => value.toLowerCase().includes(term)),
  )
})

const departments = computed(() => new Set(employees.value.map((employee) => employee.department)).size)
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Employee Info home">
        <span class="brand-mark">EI</span>
        <span>
          <strong>Employee Info</strong>
          <small>People directory</small>
        </span>
      </a>
      <button class="primary-button" type="button">+ Add employee</button>
    </header>

    <section class="hero">
      <div>
        <p class="eyebrow">EMPLOYEE MANAGEMENT</p>
        <h1>Keep your team information organized.</h1>
        <p class="hero-copy">A clean Vue starter for managing employee profiles, departments and work status.</p>
      </div>
      <div class="hero-badge" aria-hidden="true">👥</div>
    </section>

    <section class="stats" aria-label="Employee summary">
      <article class="stat-card">
        <span>Total employees</span>
        <strong>{{ employees.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Departments</span>
        <strong>{{ departments }}</strong>
      </article>
      <article class="stat-card">
        <span>Active members</span>
        <strong>{{ employees.filter((employee) => employee.status === 'Active').length }}</strong>
      </article>
    </section>

    <section class="directory">
      <div class="section-heading">
        <div>
          <p class="eyebrow">DIRECTORY</p>
          <h2>Employees</h2>
        </div>
        <label class="search-box">
          <span>⌕</span>
          <input v-model="query" type="search" placeholder="Search employees..." aria-label="Search employees" />
        </label>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in filteredEmployees" :key="employee.id">
              <td>
                <div class="employee-cell">
                  <span class="avatar">{{ employee.initials }}</span>
                  <span><strong>{{ employee.name }}</strong><small>{{ employee.role }} · {{ employee.email }}</small></span>
                </div>
              </td>
              <td><code>{{ employee.id }}</code></td>
              <td>{{ employee.department }}</td>
              <td><span class="status" :class="employee.status.toLowerCase()">{{ employee.status }}</span></td>
            </tr>
            <tr v-if="filteredEmployees.length === 0">
              <td class="empty-state" colspan="4">No employee matched “{{ query }}”.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
