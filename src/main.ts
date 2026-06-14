import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node');
}

app.innerHTML = '<p style="padding: 24px">AI Agent Stress Sandbox</p>';
