import { readable } from 'svelte/store';

const user = readable({ ktun: 'username', salasana: 'password' });

export default user;
