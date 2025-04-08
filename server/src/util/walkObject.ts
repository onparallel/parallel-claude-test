/**
 * Recursively traverses an object and its nested properties, calling a callback function
 * for each key-value pair encountered. Handles circular references to prevent infinite recursion.
 *
 * @param obj - The object to traverse
 * @param callback - Function called for each key-value pair with parameters:
 *                   - key: The current property name
 *                   - value: The current property value
 *                   - node: The parent object containing the current property
 * @param visited - Set used to track visited objects to prevent infinite recursion
 *                  on circular references. Defaults to a new Set if not provided.
 */
export function walkObject(
  obj: any,
  callback: (key: string, value: any, node: any) => void,
  visited = new Set<any>(),
) {
  // Skip if obj is null, undefined, or not an object
  if (!obj || typeof obj !== "object") return;

  // Skip if we've already visited this object (prevents infinite recursion)
  if (visited.has(obj)) return;

  visited.add(obj);

  // Iterate through all enumerable properties of the object
  for (const [key, value] of Object.entries(obj)) {
    // Call the callback with current key-value pair and parent object
    callback(key, value, obj);

    // Recursively traverse nested objects
    if (value && typeof value === "object") {
      walkObject(value, callback, visited);
    }
  }
}
