# DB repositories

`/src/db/repositories`

Each repository file defines the basic logic for the calls to the database using Knex.

# GraphQL - server side

We have implement a GraphQL api using Nexus.

The definition of the GraphQL types, queries and mutations is localed in: `/src/graphql/[entity]/*.ts`

When running the api locally, `parallel-schema.graphql` will be regenerated automatically everytime there are changes.
This is the file that is used by the playground `http://localhost/graphql` for autocompletion and documentation.

# GraphQL - client side

Order:

1. Define the GQL string. Example:

```
function useUpdatePetition() {
  return useMutation(gql`
    mutation PetitionReplies_updatePetition(
      $id: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(id: $id, data: $data) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.petition}
  `);
}
```

2. Generate types running the `generate-graphql-types`. Make sure that the server is up and running or the script will return an error.

3. Now you can include the types in the functions:

```
function useUpdatePetition() {
  return useMutation<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >(gql`
    mutation PetitionReplies_updatePetition(
      $id: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(id: $id, data: $data) {
        ...PetitionReplies_Petition
      }
    }
    ${PetitionReplies.fragments.petition}
  `);
}
```
