# Stories UI - Chakra UI v3 API

## Propósito

Estas stories documentan y demuestran los componentes UI de abstracción que implementan la **API de Chakra UI v3** usando v2 por debajo.

## Estrategia de Migración

### ✅ Solo API v3

- Todas las stories usan **exclusivamente** la API v3
- No hay ejemplos de compatibilidad v2/v3
- Facilita la migración componente por componente

### Cambios de Props Principales

| v2 API          | v3 API         |
| --------------- | -------------- |
| `isDisabled`    | `disabled`     |
| `isInvalid`     | `invalid`      |
| `isRequired`    | `required`     |
| `isOpen`        | `open`         |
| `colorScheme`   | `colorPalette` |
| `allowMultiple` | `multiple`     |
| `allowToggle`   | `collapsible`  |
| `spacing`       | `gap`          |

### Componentes Documentados

- **Layout**: Box, Stack, Text, Flex
- **Forms**: Button, Input, Select, Checkbox, Switch, Field, NumberInput, PinInput, RadioGroup
- **Overlay**: Menu, Dialog, Popover, Tooltip
- **Navigation**: Tabs, Accordion, Collapsible
- **Data Display**: Avatar

## Uso en Desarrollo

1. **Consulta las stories** para ver la API v3 correcta
2. **Copia los ejemplos** directamente en tu código
3. **No uses props v2** - las stories solo muestran v3

## Migración por Componente

Cuando migres un componente en la app:

1. Cambia el import a `@parallel/components/ui`
2. Actualiza las props según la tabla de arriba
3. Usa las stories como referencia

Ejemplo:

```tsx
// ❌ Antes (v2)
import { Button } from "@chakra-ui/react";
<Button isDisabled colorScheme="blue">
  Click
</Button>;

// ✅ Después (v3)
import { Button } from "@parallel/components/ui";
<Button disabled colorPalette="blue">
  Click
</Button>;
```
