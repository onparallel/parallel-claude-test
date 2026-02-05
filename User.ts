export class User {
  constructor(
    public id: string,
    public name: string,
  ) {}

  getUserInfo() {
    console.log(`User ID: ${this.id}, User Name: ${this.name}`); // Console.log in production code
  }

  updateUserName(newName: string) {
    this.name = newName;
    console.log(`User name updated to: ${this.name}`); // Console.log in production code
  }

  deleteUser() {
    console.log(`User with ID: ${this.id} has been deleted.`); // Console.log in production code
  }
}
