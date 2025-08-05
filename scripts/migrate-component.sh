#!/bin/bash

# Migration script for Chakra UI components
# Usage: ./scripts/migrate-component.sh Accordion
# This local script 

COMPONENT=$1

if [ -z "$COMPONENT" ]; then
  echo "Usage: $0 <ComponentName>"
  echo "Example: $0 Accordion"
  exit 1
fi

echo "🔍 Finding $COMPONENT usage in codebase..."

# Check if component exists in our UI library
UI_COMPONENT_PATH="client/components/ui/${COMPONENT}.tsx"
if [ ! -f "$UI_COMPONENT_PATH" ]; then
  echo "❌ Component $COMPONENT not found in client/components/ui/"
  echo "Available components:"
  ls client/components/ui/*.tsx | sed 's/.*\///' | sed 's/\.tsx$//' | grep -v index | sort
  exit 1
fi

# Get the documentation URL from the component file
DOC_URL=$(grep -o "https://chakra-ui\.com/docs/components/[^\"]*" "$UI_COMPONENT_PATH" | head -1)
if [ -n "$DOC_URL" ]; then
  echo "📖 Documentation: $DOC_URL"
fi

# Find all imports from @chakra-ui/react that include this component
echo "\n📦 Chakra UI imports to migrate:"
grep -r "import.*${COMPONENT}" client/ --include="*.tsx" --include="*.ts" | grep "@chakra-ui/react" | head -10

# Find all imports from @parallel/components/ui that already use this component
echo "\n✅ Already migrated imports:"
grep -r "import.*${COMPONENT}" client/ --include="*.tsx" --include="*.ts" | grep "@parallel/components/ui" | wc -l | xargs echo "Count:"

# Find JSX usage patterns
echo "\n🏷️  JSX usage patterns:"
grep -r "<${COMPONENT}[^a-zA-Z]" client/ --include="*.tsx" | grep -v "client/components/ui" | head -10

# Count total occurrences
CHAKRA_IMPORTS=$(grep -r "import.*${COMPONENT}" client/ --include="*.tsx" --include="*.ts" | grep "@chakra-ui/react" | wc -l)
JSX_USAGE=$(grep -r "<${COMPONENT}[^a-zA-Z]" client/ --include="*.tsx" | grep -v "client/components/ui" | wc -l)
ALREADY_MIGRATED=$(grep -r "import.*${COMPONENT}" client/ --include="*.tsx" --include="*.ts" | grep "@parallel/components/ui" | wc -l)

echo "\n📊 Migration status:"
echo "  - Chakra UI imports to migrate: $CHAKRA_IMPORTS"
echo "  - JSX usages to check: $JSX_USAGE"
echo "  - Already migrated: $ALREADY_MIGRATED"

# Check if component has compound structure (like Accordion.Root, Accordion.Item, etc.)
COMPOUND_EXPORTS=$(grep -A 20 "export const ${COMPONENT} = {" "$UI_COMPONENT_PATH" | grep -c ":")
if [ "$COMPOUND_EXPORTS" -gt 0 ]; then
  echo "\n🔧 Compound component structure detected:"
  grep -A 20 "export const ${COMPONENT} = {" "$UI_COMPONENT_PATH" | grep ":" | sed 's/^[[:space:]]*/  - /' | sed 's/:.*$//'
fi

echo "\n✅ Migration steps:"
echo "1. Update imports: import { $COMPONENT } from '@parallel/components/ui'"
if [ "$COMPOUND_EXPORTS" -gt 0 ]; then
  echo "2. Update JSX: Use compound structure like <$COMPONENT.Root>, <$COMPONENT.Item>, etc."
  echo "\n📝 Example migration:"
  echo "   Before: <$COMPONENT>"
  echo "   After:  <$COMPONENT.Root>"
else
  echo "2. Update JSX: Replace <$COMPONENT> with new v3 API"
fi
echo "3. Update props according to v3 API changes"
echo "4. Test component functionality"
echo "5. Update stories if they exist"

# Show specific migration examples based on component
case "$COMPONENT" in
  "Button")
    echo "\n📝 Button migration examples:"
    echo "   colorScheme → colorPalette"
    echo "   isLoading → loading"
    echo "   isDisabled → disabled"
    ;;
  "Accordion")
    echo "\n📝 Accordion migration examples:"
    echo "   <Accordion allowToggle> → <Accordion.Root collapsible>"
    echo "   <AccordionItem> → <Accordion.Item value=\"item-1\">"
    echo "   <AccordionButton> → <Accordion.ItemTrigger>"
    echo "   <AccordionPanel> → <Accordion.ItemContent>"
    ;;
  "Menu")
    echo "\n📝 Menu migration examples:"
    echo "   <Menu> → <Menu.Root>"
    echo "   <MenuButton> → <Menu.Trigger>"
    echo "   <MenuList> → <Menu.Content>"
    echo "   <MenuItem> → <Menu.Item>"
    ;;
esac

# Check if stories exist
STORY_FILE="client/stories/ui/${COMPONENT}.stories.tsx"
if [ -f "$STORY_FILE" ]; then
  echo "\n📚 Story file exists: $STORY_FILE"
else
  echo "\n📚 No story file found for $COMPONENT"
fi

# Suggest next actions
echo "\n🚀 Next actions:"
if [ "$CHAKRA_IMPORTS" -gt 0 ]; then
  echo "   1. Run: grep -r \"import.*${COMPONENT}\" client/ --include=\"*.tsx\" | grep \"@chakra-ui/react\""
  echo "   2. Update imports manually or create a script"
fi
if [ "$JSX_USAGE" -gt 0 ]; then
  echo "   3. Review JSX usage patterns above"
  echo "   4. Update components one by one"
fi
echo "   5. Test in Storybook: npm run storybook"
