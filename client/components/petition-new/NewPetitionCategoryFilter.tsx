import { Button, Flex, RadioProps, useRadio, useRadioGroup } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

interface NewPetitionCategoryFilterProps extends ValueProps<string> {
  categories: string[];
}

export const NewPetitionCategoryFilter = chakraForwardRef<"div", NewPetitionCategoryFilterProps>(
  function NewPetitionCategoryFilter({ value, onChange, categories, ...props }, ref) {
    const intl = useIntl();

    const allCategories = usePublicTemplateCategories();

    const options = [
      {
        label: intl.formatMessage({
          id: "generic.all-categories-short",
          defaultMessage: "All",
        }),
        slug: "all",
      },
      ...categories.map((value) => allCategories.find((c) => c.slug === value)).filter(isDefined),
    ];

    const { getRootProps, getRadioProps } = useRadioGroup({
      name: "categories",
      value: value ?? "all",
      onChange: (value: string) => onChange(value === "all" ? null : value),
    });

    const group = getRootProps();

    return (
      <Flex ref={ref} {...props} {...group} flexWrap="wrap" gridRowGap={2} gridColumnGap={3}>
        {options.map(({ slug, label }) => {
          const radio = getRadioProps({ value: slug });
          return (
            <CategoryRadio key={slug} {...radio}>
              {label}
            </CategoryRadio>
          );
        })}
      </Flex>
    );
  }
);

function CategoryRadio(props: RadioProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();

  return (
    <Button
      rounded="full"
      size="sm"
      variant="outline"
      fontWeight="normal"
      as="label"
      htmlFor={input.id}
      cursor="pointer"
      _checked={{
        backgroundColor: "blue.500",
        borderColor: "blue.500",
        color: "white",
        fontWeight: "bold",
        _hover: {
          backgroundColor: "blue.600",
          borderColor: "blue.600",
        },
      }}
      {...getCheckboxProps()}
    >
      <input {...getInputProps()} />
      {props.children}
    </Button>
  );
}
