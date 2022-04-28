<script>
  import { scale } from 'svelte/transition';

</script>

<div class="backdrop" on:click />

<div class="modal" transition:scale>
  <header>
    <slot name="header" />
  </header>

  <slot />

  <footer>
    <slot name="footer" />
  </footer>
</div>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.281);
    z-index: 10;
  }

  .modal {
    padding: 1rem;
    position: fixed;
    top: 10vh;
    right: 10%;
    width: 200px;
    max-height: 80vh;
    background: white;
    border-radius: 5px;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    overflow: scroll;
  }

  header {
    border-bottom: 1px solid #ccc;
  }

  footer {
    border-top: 1px solid #ccc;
    margin-top: 2em;
    padding-top: 1em;
  }

</style>
