# ✂️ BarberFlow Interno

Sistema web de controle de agendamentos para barbearia, desenvolvido como projeto acadêmico.

---

## 🎯 Objetivo

Facilitar o gerenciamento diário de uma barbearia, permitindo controlar agendamentos, serviços, faturamento e configurações em um único sistema.

---

## 👤 Integrantes

- João Pedro Lima Barbosa

---

## 🛠️ Tecnologias Utilizadas

- **Vue.js 3** — Framework front-end
- **Pinia** — Gerenciamento de estado
- **Vue Router** — Roteamento entre telas
- **Supabase** — Banco de dados e backend
- **Vite** — Bundler e servidor de desenvolvimento
- **BrasilAPI** — Validação de feriados nacionais

---

## 📋 Funcionalidades

- Dashboard com métricas do dia e agenda visual
- Agendamentos com calendário semanal navegável
- CRUD completo de serviços (criar, listar, editar, excluir)
- CRUD completo de agendamentos
- Relatório de faturamento por dia, semana e mês
- Página de configurações de horário de funcionamento
- Validação automática de domingos e feriados
- Tema escuro dourado responsivo

---

## 🗄️ Banco de Dados

3 tabelas no Supabase:

| Tabela | Descrição |
|--------|-----------|
| `services` | Serviços oferecidos pela barbearia |
| `appointments` | Agendamentos dos clientes |
| `settings` | Configurações de horário de funcionamento |

---

## 📁 Estrutura do Projeto
barberflow-interno/
├── src/
│   ├── assets/styles/    ← Estilos globais e tema
│   ├── components/       ← Componentes reutilizáveis
│   ├── lib/              ← Configuração do Supabase
│   ├── router/           ← Rotas da aplicação
│   ├── stores/           ← Estado global com Pinia
│   └── views/            ← Telas da aplicação
├── .env                  ← Credenciais (não versionado)
├── index.html
└── package.json
---

## 🚀 Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/JoaoPedroLimaBarbosa/barberflow-interno.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o `.env` com suas credenciais do Supabase:
4. VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
5. Acesse em **http://localhost:5173**
