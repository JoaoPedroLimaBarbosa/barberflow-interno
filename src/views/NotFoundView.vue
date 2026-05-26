<template>
  <div class="not-found">
    <div class="not-found-content">
      <span class="not-found-code">404</span>
      <div class="gold-line" style="margin: 20px auto" />
      <h1 class="not-found-title">Página não encontrada</h1>
      <p class="not-found-text">A página que você procura não existe ou foi movida.</p>
      <router-link to="/" class="btn btn-primary" style="margin-top: 24px">
        Voltar ao Dashboard
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.not-found-code {
  font-family: var(--font-display);
  font-size: 7rem;
  font-weight: 700;
  color: var(--color-gold);
  opacity: 0.3;
  line-height: 1;
}

.not-found-title {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.not-found-text {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>
