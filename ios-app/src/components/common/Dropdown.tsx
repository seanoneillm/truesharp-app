import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  placeholder?: string;
  options: DropdownOption[];
  selectedValues?: string[];
  selectedValue?: string;
  multiSelect?: boolean;
  onSelectionChange: (values: string[] | string) => void;
  disabled?: boolean;
  icon?: string;
  isPro?: boolean;
  showProBadge?: boolean;
}

export default function Dropdown({
  label,
  placeholder = 'Select...',
  options,
  selectedValues = [],
  selectedValue,
  multiSelect = false,
  onSelectionChange,
  disabled = false,
  icon,
  isPro = false,
  showProBadge = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelectedValues, setLocalSelectedValues] = useState<string[]>(
    multiSelect ? selectedValues : selectedValue ? [selectedValue] : []
  );

  const isLocked = isPro && showProBadge;

  const handleOptionPress = (value: string) => {
    if (isLocked) return;

    let newValues: string[];

    if (multiSelect) {
      if (localSelectedValues.includes(value)) {
        newValues = localSelectedValues.filter(v => v !== value);
      } else {
        newValues = [...localSelectedValues, value];
      }
      setLocalSelectedValues(newValues);
      onSelectionChange(newValues);
    } else {
      newValues = [value];
      setLocalSelectedValues(newValues);
      onSelectionChange(value);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (localSelectedValues.length === 0) {
      return placeholder;
    }

    if (multiSelect) {
      if (localSelectedValues.length === 1) {
        const option = options.find(opt => opt.value === localSelectedValues[0]);
        return option?.label || placeholder;
      }
      return `${localSelectedValues.length} selected`;
    } else {
      const option = options.find(opt => opt.value === localSelectedValues[0]);
      return option?.label || placeholder;
    }
  };

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = localSelectedValues.includes(item.value);
    
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => handleOptionPress(item.value)}
        disabled={isLocked}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {item.label}
        </Text>
        {multiSelect && isSelected && (
          <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {showProBadge && isPro && (
          <View style={[styles.proBadge, { backgroundColor: `${theme.colors.filters.pro}20` }]}>
            <Ionicons name="lock-closed" size={12} color={theme.colors.filters.pro} />
            <Text style={[styles.proText, { color: theme.colors.filters.pro }]}>PRO</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.dropdown,
          isOpen && styles.dropdownOpen,
          disabled && styles.dropdownDisabled,
          isLocked && styles.dropdownLocked,
        ]}
        onPress={() => !disabled && !isLocked && setIsOpen(true)}
        disabled={disabled || isLocked}
      >
        <View style={styles.dropdownContent}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={16}
              color={disabled || isLocked ? theme.colors.text.light : theme.colors.text.secondary}
              style={styles.dropdownIcon}
            />
          )}
          <Text
            style={[
              styles.dropdownText,
              localSelectedValues.length === 0 && styles.placeholderText,
              (disabled || isLocked) && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={disabled || isLocked ? theme.colors.text.light : theme.colors.text.secondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={20}
              windowSize={10}
            />

            {multiSelect && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
  },
  proText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  dropdownOpen: {
    borderColor: theme.colors.primary,
  },
  dropdownDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  dropdownLocked: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: theme.spacing.sm,
  },
  dropdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text.light,
  },
  disabledText: {
    color: theme.colors.text.light,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    width: screenWidth * 0.9,
    maxHeight: '70%',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});