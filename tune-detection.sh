#!/bin/bash

# Interactive Detection Parameter Tuner
# ปรับค่า parameters แบบ interactive และทดสอบทันที

cd /home/teddy/deploy

echo "🎛️  AT-02 Detection Parameter Tuner"
echo "========================================="
echo ""
echo "Current parameters (v20):"
echo "  minConsecutivePoints: 2"
echo "  minVolumeChange: 50 m³"
echo "  recoveryThreshold: 0.0005"
echo "  threshold: -0.005"
echo ""

# Menu
while true; do
    echo "Select test scenario:"
    echo "  1) Very Sensitive (จับเกือบทุกอย่าง)"
    echo "  2) Sensitive (จับง่าย)"
    echo "  3) Moderate (ปานกลาง)"
    echo "  4) Strict (เข้มงวด)"
    echo "  5) Custom (กำหนดเอง)"
    echo "  6) Exit"
    echo ""
    read -p "Choice [1-6]: " choice
    
    case $choice in
        1)
            echo ""
            echo "🔍 Testing Very Sensitive..."
            echo "   minConsecutivePoints: 1"
            echo "   minVolumeChange: 30 m³"
            echo "   recoveryThreshold: 0.0003"
            echo ""
            node test-detection.js 1440 -0.01
            ;;
        2)
            echo ""
            echo "🔍 Testing Sensitive..."
            echo "   minConsecutivePoints: 2"
            echo "   minVolumeChange: 50 m³"
            echo "   recoveryThreshold: 0.0005"
            echo ""
            node test-detection.js 1440 -0.005
            ;;
        3)
            echo ""
            echo "🔍 Testing Moderate..."
            echo "   minConsecutivePoints: 3"
            echo "   minVolumeChange: 100 m³"
            echo "   recoveryThreshold: 0.001"
            echo ""
            node test-detection.js 1440 -0.005
            ;;
        4)
            echo ""
            echo "🔍 Testing Strict..."
            echo "   minConsecutivePoints: 5"
            echo "   minVolumeChange: 200 m³"
            echo "   recoveryThreshold: 0.002"
            echo ""
            node test-detection.js 1440 -0.005
            ;;
        5)
            echo ""
            read -p "Enter minutes to test [1440]: " mins
            mins=${mins:-1440}
            read -p "Enter threshold [-0.005]: " thresh
            thresh=${thresh:--0.005}
            echo ""
            echo "🔍 Testing Custom..."
            node test-detection.js $mins $thresh
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
