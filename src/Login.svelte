<script>
  import user from './loginStore.js';

  let username = '';
  let password = '';
  let login = 0;
  function LogOut() {
    login = 0;
  }
  function LogIn() {
    if (username == $user.ktun && password == $user.salasana) {
      login += 1;
    }
  }
</script>

<main>
  {#if login == 0}
    <div>
      <input
        type="text"
        bind:value={username}
        placeholder="type your username"
      />
    </div>

    <input
      type="password"
      bind:value={password}
      placeholder="type your password"
    />
    <button on:click={LogIn}>Login</button>
  {/if}
  {#if login == 1}
    <div>
      <p>Tervetuloa &#60 {$user.ktun} &#62</p>
    </div>

    <button on:click={LogOut}>Logout</button>
  {/if}
</main>

<style>
  input {
    background-color: rgb(233, 254, 255);
    border: 1px solid black;
  }
</style>
