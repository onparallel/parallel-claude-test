# Componentes UI de Abstracción para Chakra UI v3

## Propósito

Esta capa de abstracción está diseñada para facilitar la migración de Chakra UI v2 a v3 de manera progresiva.
Los componentes implementan la **API de v3** usando Chakra UI v2 por debajo, permitiendo:

1. **Migración componente por componente** - cada PR migra un tipo de componente específico
2. **API consistente de v3** - sin confusión entre versiones
3. **Preparación para v3 real** - cuando migremos, solo cambiamos la implementación interna

## Componentes Incluidos

Todos los componentes principales de Chakra UI están disponibles con la API de v3:

### Cambios de Props (v2 → v3)

- `isOpen` → `open`
- `colorScheme` → `colorPalette`
- `isDisabled` → `disabled`
- `isInvalid` → `invalid`
- `isRequired` → `required`
- `isReadOnly` → `readOnly`
- `spacing` → `gap`
- `allowMultiple` → `multiple`
- `allowToggle` → `collapsible`
- `onChange` → `onValueChange`

### Patrones Compuestos (Namespace)

Los componentes usan el patrón de namespace de v3:

- `Accordion.Root`, `Accordion.Item`, `Accordion.ItemTrigger`
- `Dialog.Root`, `Dialog.Content`, `Dialog.Title`
- `PinInput.Root`, `PinInput.Input`, `PinInput.Control`
- `NumberInput.Root`, `NumberInput.Input`, `NumberInput.Control`
- `Collapsible.Root`, `Collapsible.Content`

## Ejemplo de Uso

```tsx
// ✅ Solo API v3
import { Button, Dialog, Stack } from "@/components/ui";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={4}>
      <Button colorPalette="blue" onClick={() => setOpen(true)}>
        Abrir Dialog
      </Button>

      <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>Mi Dialog</Dialog.Title>
            <Dialog.Description>Contenido del dialog usando API v3</Dialog.Description>
            <Dialog.Footer>
              <Button onClick={() => setOpen(false)}>Cerrar</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Stack>
  );
}
```

## Estrategia de Migración

### 1. Migración por Componente

```bash
# Script para migrar un componente específico
./scripts/migrate-component.sh Accordion

# Esto:
# - Encuentra todos los usos del componente
# - Crea una branch específica
# - Te guía en la migración
```

### 2. Proceso por PR

1. **Una PR por tipo de componente** (ej: todos los Accordion)
2. **Migrar TODOS los usos** de ese componente en la PR
3. **Testing completo** antes de merge
4. **No mezclar componentes** en la misma PR

### 3. Cuando migremos a v3 real

```tsx
// Solo cambiar la implementación interna:
// client/components/ui/Dialog.tsx

// Antes (v2 interno):
return <ChakraModal {...v2Props}>{children}</ChakraModal>;

// Después (v3 real):
return <ChakraDialog.Root {...props}>{children}</ChakraDialog.Root>;
```

## Ventajas de esta Estrategia

- ✅ **Sin confusión** - solo una API por componente
- ✅ **Migración forzada pero gradual** - cada PR es completa
- ✅ **Testing aislado** - un componente a la vez
- ✅ **Rollback fácil** - revertir una PR específica
- ✅ **Preparación real para v3** - API idéntica

## Scripts Disponibles

```bash
# Encontrar usos de un componente
./scripts/migrate-component.sh Button

# Actualizar todas las stories (ya hecho)
sed -i '' 's/spacing=/gap=/g' client/stories/ui/*.tsx
```
